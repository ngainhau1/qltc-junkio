const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/authMiddleware');
const { uploadAvatar } = require('../middleware/uploadMiddleware');
const audit = require('../middleware/auditMiddleware');
const authValidator = require('../validators/authValidator');

// @route   POST api/auth/register
router.post('/register', authValidator.validateRegister, audit('USER_REGISTER', 'USER'), authController.register);

// @route   POST api/auth/login
router.post('/login', authValidator.validateLogin, audit('USER_LOGIN', 'USER'), authController.login);

// @route   POST api/auth/refresh-token
router.post('/refresh-token', authController.refreshToken);

// @route   GET api/auth/me
router.get('/me', auth, authController.getMe);

// @route   POST api/auth/avatar
router.post('/avatar', auth, uploadAvatar.single('avatar'), authController.updateAvatar);

// @route   POST api/auth/forgot-password
router.post('/forgot-password', authValidator.validateForgotPassword, authController.forgotPassword);

// @route   POST api/auth/reset-password/:token
router.post('/reset-password/:token', authValidator.validateResetPassword, authController.resetPassword);

module.exports = router;
