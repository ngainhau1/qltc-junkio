const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const auth = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Thông báo hệ thống
 */

// @route   GET api/notifications
// @desc    Get user notifications
// @access  Private
/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Lấy danh sách thông báo của tôi
 *     tags: [Notifications]
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       200: { description: Danh sách thông báo }
 */
router.get('/', auth, notificationController.getNotifications);

// @route   PUT api/notifications/read-all
// @desc    Mark all user notifications as read
// @access  Private
/**
 * @swagger
 * /api/notifications/read-all:
 *   put:
 *     summary: Đánh dấu tất cả thông báo đã đọc
 *     tags: [Notifications]
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       200: { description: Thành công }
 */
router.put('/read-all', auth, notificationController.markAllAsRead);

// @route   PUT api/notifications/:id/read
// @desc    Mark a single user notification as read
// @access  Private
/**
 * @swagger
 * /api/notifications/{id}/read:
 *   put:
 *     summary: Đánh dấu 1 thông báo đã đọc
 *     tags: [Notifications]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200: { description: Thành công }
 */
router.put('/:id/read', auth, notificationController.markAsRead);

// @route   POST api/notifications/broadcast
// @desc    Admin broadcasts a message to all users
// @access  Private (Admin only logic inside)
/**
 * @swagger
 * /api/notifications/broadcast:
 *   post:
 *     summary: Gửi broadcast tới tất cả user (admin)
 *     tags: [Notifications]
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       200: { description: Đã gửi broadcast }
 */
router.post('/broadcast', auth, notificationController.adminBroadcast);

module.exports = router;
