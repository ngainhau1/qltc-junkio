const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/authMiddleware');
const { uploadAvatar } = require('../middleware/uploadMiddleware');
const audit = require('../middleware/auditMiddleware');
const authValidator = require('../validators/authValidator');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Xác thực người dùng và quản lý phiên đăng nhập
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Đăng ký tài khoản mới
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Nguyen Van A
 *               email:
 *                 type: string
 *                 example: user@junkio.com
 *               password:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       201:
 *         description: Đăng ký thành công
 *       400:
 *         description: Email đã tồn tại hoặc dữ liệu không hợp lệ
 */
router.post('/register', authValidator.validateRegister, audit('USER_REGISTER', 'USER'), authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Đăng nhập và nhận JWT Token
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: demo@junkio.com
 *               password:
 *                 type: string
 *                 example: demo123
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT Access Token (hết hạn sau 15 phút)
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                       enum: [member, admin]
 *       400:
 *         description: Email hoặc mật khẩu không đúng
 */
router.post('/login', authValidator.validateLogin, audit('USER_LOGIN', 'USER'), authController.login);

// @route   POST api/auth/refresh-token
router.post('/refresh-token', authController.refreshToken);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Lấy thông tin người dùng hiện tại
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *                 role:
 *                   type: string
 *       401:
 *         description: Chưa đăng nhập hoặc token hết hạn
 */
router.get('/me', auth, authController.getMe);

// @route   POST api/auth/avatar
router.post('/avatar', auth, uploadAvatar.single('avatar'), authController.updateAvatar);

// @route   POST api/auth/forgot-password
router.post('/forgot-password', authValidator.validateForgotPassword, authController.forgotPassword);

// @route   POST api/auth/reset-password/:token
router.post('/reset-password/:token', authValidator.validateResetPassword, authController.resetPassword);

module.exports = router;


