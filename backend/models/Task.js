const { pool } = require('../config/db');
const { getOrCreateScheduleId } = require('./Schedule');
const { reminderOffsetMinutes, isValidTimeRange } = require('../utils/validators');

function mapTask(row) {
  return {
    id: row.id,
    title: row.title,
    text: row.title,
    date: row.task_date_text,
    startTime: row.start_time || '',
    endTime: row.end_time_text || '',
    completed: Boolean(row.is_completed),
    reminder: row.reminder_label || '',
    reminderAt: row.reminder_at || '',
    '文字': row.title,
    '时间标签': row.start_time || '',
    '时间结束': row.end_time_text || '',
    '提醒': row.reminder_label || '',
    '提醒时间': row.reminder_at || '',
    '已完成': Boolean(row.is_completed)
  };
}

async function selectTasksForUser(userId, whereSql, params = [], db = pool) {
  const result = await db.query(`
    SELECT
      t.id,
      t.title,
      to_char(t.task_date, 'YYYY-MM-DD') AS task_date_text,
      to_char(t.task_time, 'HH24:MI') AS start_time,
      to_char(t.end_time, 'HH24:MI') AS end_time_text,
      t.is_completed,
      r.label AS reminder_label,
      to_char(r.remind_at, 'YYYY-MM-DD"T"HH24:MI:SS') AS reminder_at
    FROM tasks t
    JOIN schedules s ON s.id = t.schedule_id
    LEFT JOIN reminders r ON r.task_id = t.id
    WHERE s.user_id = $1 ${whereSql}
    ORDER BY
      t.task_date ASC,
      t.task_time ASC NULLS LAST,
      CASE
        WHEN t.task_time IS NULL OR t.end_time IS NULL THEN 0
        WHEN t.end_time >= t.task_time THEN EXTRACT(EPOCH FROM (t.end_time - t.task_time))
        ELSE 0
      END DESC,
      t.id ASC
  `, [userId, ...params]);

  return result.rows.map(mapTask);
}

async function createTask(userId, input) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const scheduleId = await getOrCreateScheduleId(userId, client);
    const created = await client.query(
      `INSERT INTO tasks (schedule_id, title, task_date, task_time, end_time)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [scheduleId, input.title, input.date, input.startTime, input.endTime]
    );

    await upsertReminder(created.rows[0].id, input.date, input.startTime, input.reminder, client);

    await client.query('COMMIT');
    const tasks = await selectTasksForUser(userId, 'AND t.id = $2', [created.rows[0].id]);
    return tasks[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function updateTask(userId, taskId, input) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const current = await client.query(`
      SELECT
        t.id,
        to_char(t.task_date, 'YYYY-MM-DD') AS task_date,
        to_char(t.task_time, 'HH24:MI') AS task_time,
        to_char(t.end_time, 'HH24:MI') AS end_time
      FROM tasks t
      JOIN schedules s ON s.id = t.schedule_id
      WHERE t.id = $1 AND s.user_id = $2
      FOR UPDATE
    `, [taskId, userId]);

    if (!current.rows[0]) {
      await client.query('ROLLBACK');
      return null;
    }

    const fields = [];
    const values = [];
    const nextStartTime = Object.prototype.hasOwnProperty.call(input, 'startTime')
      ? input.startTime
      : current.rows[0].task_time;
    const nextEndTime = Object.prototype.hasOwnProperty.call(input, 'endTime')
      ? input.endTime
      : current.rows[0].end_time;

    if (!isValidTimeRange(nextStartTime, nextEndTime)) {
      const error = new Error('结束时间不能早于开始时间');
      error.statusCode = 400;
      throw error;
    }

    if (Object.prototype.hasOwnProperty.call(input, 'title')) {
      values.push(input.title);
      fields.push(`title = $${values.length}`);
    }
    if (Object.prototype.hasOwnProperty.call(input, 'date')) {
      values.push(input.date);
      fields.push(`task_date = $${values.length}`);
    }
    if (Object.prototype.hasOwnProperty.call(input, 'startTime')) {
      values.push(input.startTime);
      fields.push(`task_time = $${values.length}`);
    }
    if (Object.prototype.hasOwnProperty.call(input, 'endTime')) {
      values.push(input.endTime);
      fields.push(`end_time = $${values.length}`);
    }
    if (Object.prototype.hasOwnProperty.call(input, 'completed')) {
      values.push(Boolean(input.completed));
      fields.push(`is_completed = $${values.length}`);
    }

    if (fields.length > 0) {
      values.push(taskId);
      await client.query(`UPDATE tasks SET ${fields.join(', ')} WHERE id = $${values.length}`, values);
    }

    if (Object.prototype.hasOwnProperty.call(input, 'reminder')) {
      const nextDate = input.date || current.rows[0].task_date;
      await upsertReminder(taskId, nextDate, nextStartTime, input.reminder, client);
    }

    await client.query('COMMIT');
    const tasks = await selectTasksForUser(userId, 'AND t.id = $2', [taskId]);
    return tasks[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function deleteTask(userId, taskId) {
  const result = await pool.query(`
    DELETE FROM tasks t
    USING schedules s
    WHERE t.schedule_id = s.id AND t.id = $1 AND s.user_id = $2
    RETURNING t.id
  `, [taskId, userId]);

  return Boolean(result.rows[0]);
}

async function upsertReminder(taskId, taskDate, startTime, reminder, db = pool) {
  await db.query('DELETE FROM reminders WHERE task_id = $1', [taskId]);
  if (!reminder || !startTime) return;

  const offset = reminderOffsetMinutes(reminder);
  if (!offset) return;

  await db.query(
    `INSERT INTO reminders (task_id, remind_at, label)
     VALUES ($1, (($2::date + $3::time) - ($4::int * interval '1 minute')), $5)`,
    [taskId, taskDate, startTime, offset, reminder]
  );
}

module.exports = {
  selectTasksForUser,
  createTask,
  updateTask,
  deleteTask
};
