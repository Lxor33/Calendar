const express = require('express');
const SettingsController = require('../controllers/SettingsController');
const requireAuth = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.get('/', requireAuth, asyncHandler(SettingsController.getSettings));
router.put('/language', requireAuth, asyncHandler(SettingsController.updateLanguage));

module.exports = router;
