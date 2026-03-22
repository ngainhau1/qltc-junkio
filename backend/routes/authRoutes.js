const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
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

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     summary: Làm mới Access Token từ Refresh Token (cookie)
 *     tags: [Auth]
 *     security: []
 *     description: Gửi cookie refresh_token, server trả access token mới
 *     responses:
 *       200:
 *         description: Token mới
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       401:
 *         description: Không có refresh token
 *       403:
 *         description: Refresh token hết hạn hoặc không hợp lệ
 */
router.post('/refresh-token', authController.refreshToken);



/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Gửi email khôi phục mật khẩu
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@junkio.com
 *     responses:
 *       200:
 *         description: Email khôi phục đã được gửi
 *       404:
 *         description: Email không tồn tại
 */
router.post('/forgot-password', authValidator.validateForgotPassword, authController.forgotPassword);

/**
 * @swagger
 * /api/auth/reset-password/{token}:
 *   post:
 *     summary: Đặt lại mật khẩu bằng token khôi phục
 *     tags: [Auth]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Token khôi phục từ email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password]
 *             properties:
 *               password:
 *                 type: string
 *                 example: newPassword123
 *     responses:
 *       200:
 *         description: Mật khẩu đã được đặt lại
 *       400:
 *         description: Token không hợp lệ hoặc đã hết hạn
 */
router.post('/reset-password/:token', authValidator.validateResetPassword, authController.resetPassword);

module.exports = router;


