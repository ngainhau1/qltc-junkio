const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const audit = require('../middleware/auditMiddleware');
const authMiddleware = require('../middleware/authMiddleware');
const { uploadAvatar } = require('../middleware/uploadMiddleware');
const authValidator = require('../validators/authValidator');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Xac thuc nguoi dung va quan ly phien dang nhap
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Dang ky tai khoan moi
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
 *                 format: email
 *                 example: user@junkio.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "123456"
 *     responses:
 *       201:
 *         description: Dang ky thanh cong
 *       409:
 *         description: Email da ton tai
 */
router.post('/register', authValidator.validateRegister, audit('USER_REGISTER', 'USER'), authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Dang nhap va nhan JWT access token
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
 *                 format: email
 *                 example: demo@junkio.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: demo123
 *     responses:
 *       200:
 *         description: Dang nhap thanh cong
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Dang nhap thanh cong
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       description: JWT access token het han sau 15 phut
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         email:
 *                           type: string
 *                         role:
 *                           type: string
 *                           enum: [member, staff, admin]
 *       400:
 *         description: Email hoac mat khau khong dung
 */
router.post('/login', authValidator.validateLogin, audit('USER_LOGIN', 'USER'), authController.login);

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     summary: Lam moi access token tu refresh token cookie
 *     tags: [Auth]
 *     security: []
 *     description: Gui cookie refresh_token, server tra access token moi cung thong tin user toi thieu.
 *     responses:
 *       200:
 *         description: Lam moi token thanh cong
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         email:
 *                           type: string
 *                         role:
 *                           type: string
 *                           enum: [member, staff, admin]
 *       401:
 *         description: Khong co refresh token
 *       403:
 *         description: Refresh token het han hoac khong hop le
 */
router.post('/refresh-token', authController.refreshToken);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Dang xuat va xoa refresh token cookie
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Dang xuat thanh cong
 */
router.post('/logout', authController.logout);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Alias tuong thich cho /api/users/me
 *     description: Compatibility alias. Canonical endpoint la /api/users/me.
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Thong tin nguoi dung hien tai
 */
router.get('/me', authMiddleware, userController.getProfile);

/**
 * @swagger
 * /api/auth/avatar:
 *   post:
 *     summary: Alias tuong thich cho /api/users/me/avatar
 *     description: Compatibility alias. Canonical endpoint la /api/users/me/avatar.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [avatar]
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Cap nhat avatar thanh cong
 */
router.post('/avatar', authMiddleware, uploadAvatar.single('avatar'), userController.updateAvatar);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Gui email khoi phuc mat khau
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
 *                 format: email
 *                 example: user@junkio.com
 *     responses:
 *       200:
 *         description: Email khoi phuc da duoc gui
 *       404:
 *         description: Email khong ton tai
 */
router.post('/forgot-password', authValidator.validateForgotPassword, authController.forgotPassword);

/**
 * @swagger
 * /api/auth/reset-password/{token}:
 *   post:
 *     summary: Dat lai mat khau bang token khoi phuc
 *     tags: [Auth]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Token khoi phuc tu email
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
 *                 format: password
 *                 example: newPassword123
 *     responses:
 *       200:
 *         description: Mat khau da duoc dat lai
 *       400:
 *         description: Token khong hop le hoac da het han
 */
router.post('/reset-password/:token', authValidator.validateResetPassword, authController.resetPassword);

module.exports = router;
