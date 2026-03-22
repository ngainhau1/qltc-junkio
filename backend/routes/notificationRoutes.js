const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const auth = require('../middleware/authMiddleware');
const { validateBroadcast, validateNotificationParam } = require('../validators/notificationValidator');

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Thông báo hệ thống
 */

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Lấy danh sách thông báo của tôi (tối đa 50)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách thông báo
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   type:
 *                     type: string
 *                   message:
 *                     type: string
 *                   isRead:
 *                     type: boolean
 *                   created_at:
 *                     type: string
 *                     format: date-time
 */
router.get('/', auth, notificationController.getNotifications);

/**
 * @swagger
 * /api/notifications/read-all:
 *   put:
 *     summary: Đánh dấu tất cả thông báo đã đọc
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: All notifications marked as read
 */
router.put('/read-all', auth, notificationController.markAllAsRead);

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   put:
 *     summary: Đánh dấu 1 thông báo đã đọc
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID thông báo
 *     responses:
 *       200:
 *         description: Thành công
 *       404:
 *         description: Notification not found
 */
router.put('/:id/read', auth, validateNotificationParam, notificationController.markAsRead);

/**
 * @swagger
 * /api/notifications/broadcast:
 *   post:
 *     summary: Gửi broadcast tới tất cả user (admin)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               message:
 *                 type: string
 *                 example: Hệ thống sẽ bảo trì vào 22:00 tối nay
 *               type:
 *                 type: string
 *                 example: SYSTEM
 *     responses:
 *       200:
 *         description: Đã gửi broadcast
 *       403:
 *         description: Chỉ admin mới có quyền
 */
router.post('/broadcast', auth, validateBroadcast, notificationController.adminBroadcast);

module.exports = router;
