const Task = require('../models/Task');

async function showMonth(req, res) {
  const year = Number(req.params.year);
  const month = Number(req.params.month);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return res.status(400).json({ success: false, message: '月份参数无效' });
  }

  try {
    const tasks = await Task.selectTasksForUser(
      req.session.userId,
      `AND t.task_date >= make_date($2, $3, 1)
       AND t.task_date < (make_date($2, $3, 1) + interval '1 month')`,
      [year, month]
    );
    const grouped = {};
    for (const task of tasks) {
      if (!grouped[task.date]) grouped[task.date] = [];
      grouped[task.date].push(task);
    }
    res.json(grouped);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = {
  showMonth
};
