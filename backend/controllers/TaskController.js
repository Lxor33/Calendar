const Task = require('../models/Task');
const { normalizeDate, normalizeTime, isValidTimeRange } = require('../utils/validators');

async function showDate(req, res) {
  const date = normalizeDate(req.params.date);
  if (!date) return res.status(400).json({ success: false, message: '日期格式无效' });

  try {
    const tasks = await Task.selectTasksForUser(req.session.userId, 'AND t.task_date = $2', [date]);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function create(req, res) {
  const date = normalizeDate(req.body.date);
  const title = String(req.body.title || req.body.text || '').trim();
  const startTime = normalizeTime(req.body.startTime);
  const endTime = normalizeTime(req.body.endTime);
  const reminder = String(req.body.reminder || req.body['提醒'] || '').trim();

  if (!date || !title) {
    return res.status(400).json({ success: false, message: '日期和任务内容不能为空' });
  }
  if (!isValidTimeRange(startTime, endTime)) {
    return res.status(400).json({ success: false, message: '结束时间不能早于开始时间' });
  }

  try {
    const task = await Task.createTask(req.session.userId, { date, title, startTime, endTime, reminder });
    res.status(201).json(task);
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
}

async function update(req, res) {
  const taskId = Number(req.params.id);
  if (!Number.isInteger(taskId)) {
    return res.status(400).json({ success: false, message: '任务 ID 无效' });
  }

  const input = {};
  if (Object.prototype.hasOwnProperty.call(req.body, 'title')) {
    const title = String(req.body.title || '').trim();
    if (!title) return res.status(400).json({ success: false, message: '任务内容不能为空' });
    input.title = title;
  }
  if (Object.prototype.hasOwnProperty.call(req.body, 'date')) {
    const date = normalizeDate(req.body.date);
    if (!date) return res.status(400).json({ success: false, message: '日期格式无效' });
    input.date = date;
  }
  if (Object.prototype.hasOwnProperty.call(req.body, 'startTime')) {
    input.startTime = normalizeTime(req.body.startTime);
  }
  if (Object.prototype.hasOwnProperty.call(req.body, 'endTime')) {
    input.endTime = normalizeTime(req.body.endTime);
  }
  if (Object.prototype.hasOwnProperty.call(req.body, 'completed')) {
    input.completed = Boolean(req.body.completed);
  }
  if (Object.prototype.hasOwnProperty.call(req.body, 'reminder')) {
    input.reminder = String(req.body.reminder || '').trim();
  }

  if (Object.keys(input).length === 0) {
    return res.status(400).json({ success: false, message: '没有需要更新的字段' });
  }

  if (
    Object.prototype.hasOwnProperty.call(input, 'startTime') &&
    Object.prototype.hasOwnProperty.call(input, 'endTime') &&
    !isValidTimeRange(input.startTime, input.endTime)
  ) {
    return res.status(400).json({ success: false, message: '结束时间不能早于开始时间' });
  }

  try {
    const task = await Task.updateTask(req.session.userId, taskId, input);
    if (!task) return res.status(404).json({ success: false, message: '任务不存在' });
    res.json(task);
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
}

async function remove(req, res) {
  const taskId = Number(req.params.id);
  if (!Number.isInteger(taskId)) {
    return res.status(400).json({ success: false, message: '任务 ID 无效' });
  }

  try {
    const deleted = await Task.deleteTask(req.session.userId, taskId);
    if (!deleted) return res.status(404).json({ success: false, message: '任务不存在' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = {
  showDate,
  create,
  update,
  remove
};
