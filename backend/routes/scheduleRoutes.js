const express = require('express');
const ScheduleController = require('../controllers/ScheduleController');
const requireAuth = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.get('/month/:year/:month', requireAuth, asyncHandler(ScheduleController.showMonth));

module.exports = router;
