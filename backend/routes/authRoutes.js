const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/authMiddleware');

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', authController.register);

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', authController.login);

// @route   POST api/auth/refresh-token
// @desc    Refresh access token using HTTP-only cookie
// @access  Public
router.post('/refresh-token', authController.refreshToken);

// @route   GET api/auth/me
// @desc    Get current user info
// @access  Private
router.get('/me', auth, authController.getMe);

module.exports = router;
