const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Hồ sơ người dùng
 */

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Lấy thông tin cá nhân
 *     tags: [Users]
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       200: { description: Hồ sơ user }
 */
router.get('/me', userController.getProfile);

/**
 * @swagger
 * /api/users/me:
 *   put:
 *     summary: Cập nhật hồ sơ cá nhân
 *     tags: [Users]
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       200: { description: Cập nhật thành công }
 */
router.put('/me', userController.updateProfile);

/**
 * @swagger
 * /api/users/me/password:
 *   put:
 *     summary: Đổi mật khẩu
 *     tags: [Users]
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       200: { description: Đổi mật khẩu thành công }
 */
router.put('/me/password', userController.changePassword);

module.exports = router;
