const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const auth = require('../middleware/authMiddleware');
const { validateBroadcast, validateNotificationParam } = require('../validators/notificationValidator');

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: |
 *     Quản lý thông báo hệ thống.
 *     Hệ thống tự động gửi thông báo khi có sự kiện quan trọng:
 *     vượt ngân sách, mục tiêu đạt được, khoản chia tiền mới, broadcast từ admin...
 */

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Lấy danh sách thông báo của tôi
 *     description: |
 *       Trả về tối đa **50 thông báo** mới nhất của người dùng hiện tại.
 *       Mỗi thông báo bao gồm: loại, nội dung, trạng thái đã đọc, thời gian.
 *
 *       Frontend dùng API này để hiển thị badge số thông báo chưa đọc và danh sách popup.
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
 *             example:
 *               - id: "n1a2b3c4-..."
 *                 type: BUDGET_WARNING
 *                 message: "Bạn đã chi 85% ngân sách Ăn uống tháng này"
 *                 isRead: false
 *                 created_at: "2026-03-30T08:00:00.000Z"
 *               - id: "n2b3c4d5-..."
 *                 type: GOAL_ACHIEVED
 *                 message: "Chúc mừng! Mục tiêu Mua laptop đã hoàn thành"
 *                 isRead: true
 *                 created_at: "2026-03-29T15:30:00.000Z"
 */
router.get('/', auth, notificationController.getNotifications);

/**
 * @swagger
 * /api/notifications/read-all:
 *   put:
 *     summary: Đánh dấu tất cả thông báo đã đọc
 *     description: |
 *       Đánh dấu toàn bộ thông báo chưa đọc thành đã đọc.
 *       Thường được gọi khi người dùng mở dropdown thông báo.
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Đánh dấu tất cả đã đọc thành công
 *         content:
 *           application/json:
 *             example:
 *               msg: "All notifications marked as read"
 */
router.put('/read-all', auth, notificationController.markAllAsRead);

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   put:
 *     summary: Đánh dấu một thông báo cụ thể đã đọc
 *     description: |
 *       Đánh dấu một thông báo đã đọc theo UUID.
 *       Chỉ có thể đánh dấu thông báo thuộc về chính mình.
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
 *         description: UUID của thông báo
 *     responses:
 *       200:
 *         description: Đánh dấu đã đọc thành công
 *         content:
 *           application/json:
 *             example:
 *               status: success
 *               message: Đã đánh dấu đã đọc
 *       404:
 *         description: Không tìm thấy thông báo (NOTIFICATION_NOT_FOUND)
 */
router.put('/:id/read', auth, validateNotificationParam, notificationController.markAsRead);

/**
 * @swagger
 * /api/notifications/broadcast:
 *   post:
 *     summary: Gửi thông báo broadcast tới tất cả user (chỉ admin)
 *     description: |
 *       Gửi một thông báo đến **toàn bộ** người dùng trên hệ thống.
 *       Chỉ tài khoản có quyền **admin** mới được phép sử dụng.
 *
 *       Hữu ích cho: thông báo bảo trì, cập nhật tính năng mới, cảnh báo hệ thống.
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
 *                 description: Nội dung thông báo
 *               type:
 *                 type: string
 *                 example: SYSTEM
 *                 description: Loại thông báo (mặc định SYSTEM)
 *           example:
 *             message: "Hệ thống sẽ bảo trì vào 22:00 tối nay. Vui lòng lưu dữ liệu."
 *             type: SYSTEM
 *     responses:
 *       200:
 *         description: Đã gửi broadcast thành công
 *         content:
 *           application/json:
 *             example:
 *               status: success
 *               message: Đã gửi broadcast tới tất cả user
 *       403:
 *         description: Chỉ admin mới có quyền gửi broadcast
 */
router.post('/broadcast', auth, validateBroadcast, notificationController.adminBroadcast);

module.exports = router;
