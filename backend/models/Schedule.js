const { pool } = require('../config/db');

async function getOrCreateScheduleId(userId, db = pool) {
  const existing = await db.query(
    'SELECT id FROM schedules WHERE user_id = $1 ORDER BY id LIMIT 1',
    [userId]
  );

  if (existing.rows[0]) return existing.rows[0].id;

  const created = await db.query(
    'INSERT INTO schedules (user_id, name) VALUES ($1, $2) RETURNING id',
    [userId, 'Моё расписание']
  );
  return created.rows[0].id;
}

module.exports = {
  getOrCreateScheduleId
};
