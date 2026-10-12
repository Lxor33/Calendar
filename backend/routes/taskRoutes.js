const express = require('express');
const ScheduleController = require('../controllers/ScheduleController');
const TaskController = require('../controllers/TaskController');
const requireAuth = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.get('/month/:year/:month', requireAuth, asyncHandler(ScheduleController.showMonth));
router.get('/date/:date', requireAuth, asyncHandler(TaskController.showDate));
router.post('/', requireAuth, asyncHandler(TaskController.create));
router.put('/:id', requireAuth, asyncHandler(TaskController.update));
router.delete('/:id', requireAuth, asyncHandler(TaskController.remove));

module.exports = router;
