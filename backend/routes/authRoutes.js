const express = require('express');
const AuthController = require('../controllers/AuthController');
const requireAuth = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.post('/register', asyncHandler(AuthController.register));
router.post('/login', asyncHandler(AuthController.login));
router.post('/logout', requireAuth, AuthController.logout);
router.get('/me', requireAuth, asyncHandler(AuthController.me));
router.put('/password', requireAuth, asyncHandler(AuthController.changePassword));

module.exports = router;
