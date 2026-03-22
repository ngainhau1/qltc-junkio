const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const { uploadAvatar } = require('../middleware/uploadMiddleware');
const { validateUpdateProfile, validateChangePassword } = require('../validators/userValidator');

router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Ho so nguoi dung va profile endpoints canonical
 */

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Lay thong tin ca nhan
 *     description: Canonical endpoint cho profile user. Alias tuong thich tam thoi la /api/auth/me.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Ho so user thanh cong
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
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     avatar:
 *                       type: string
 *                       nullable: true
 *                     role:
 *                       type: string
 *                       enum: [member, staff, admin]
 *       404:
 *         description: User not found
 */
router.get('/me', userController.getProfile);

/**
 * @swagger
 * /api/users/me/avatar:
 *   post:
 *     summary: Cap nhat anh dai dien
 *     description: Canonical endpoint cho avatar upload. Alias tuong thich tam thoi la /api/auth/avatar.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
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
 *                 description: File anh jpg/png/gif, toi da 5MB
 *     responses:
 *       200:
 *         description: Cap nhat avatar thanh cong
 *       400:
 *         description: File khong hop le
 */
router.post('/me/avatar', uploadAvatar.single('avatar'), userController.updateAvatar);

/**
 * @swagger
 * /api/users/me:
 *   put:
 *     summary: Cap nhat ho so ca nhan
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Nguyen Van B
 *     responses:
 *       200:
 *         description: Cap nhat ho so thanh cong
 */
router.put('/me', validateUpdateProfile, userController.updateProfile);

/**
 * @swagger
 * /api/users/me/password:
 *   put:
 *     summary: Doi mat khau
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *                 example: oldPassword123
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: newPassword456
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Doi mat khau thanh cong
 *       400:
 *         description: Mat khau hien tai sai hoac mat khau moi qua ngan
 */
router.put('/me/password', validateChangePassword, userController.changePassword);

module.exports = router;
