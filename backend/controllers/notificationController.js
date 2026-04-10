const { Notification, User } = require('../models');
const { success, error: sendError, notFound, serverError } = require('../utils/responseHelper');
const { serializeNotification } = require('../utils/notificationPresenter');

// User fetches their notifications
exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.findAll({
            where: { user_id: req.user.id },
            order: [['created_at', 'DESC']],
            limit: 50
        });

        success(
            res,
            notifications.map(serializeNotification),
            'Lay danh sach thong bao thanh cong'
        );
    } catch (err) {
        console.error('Fetch notifications error:', err);
        serverError(res, 'Loi Server');
    }
};

// User marks all notification as read
exports.markAllAsRead = async (req, res) => {
    try {
        await Notification.update(
            { isRead: true },
            { where: { user_id: req.user.id, isRead: false } }
        );
        success(res, null, 'Da danh dau tat ca la da doc');
    } catch (err) {
        console.error('Mark read error:', err);
        serverError(res, 'Loi Server');
    }
};

// User marks a single notification as read
exports.markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOne({
            where: { id: req.params.id, user_id: req.user.id }
        });

        if (!notification) {
            return notFound(res, 'Khong tim thay thong bao');
        }

        notification.isRead = true;
        await notification.save();

        success(res, serializeNotification(notification), 'Da danh dau thong bao la da doc');
    } catch (err) {
        console.error('Mark read error:', err);
        serverError(res, 'Loi Server');
    }
};

// Admin broadcasts a notification to ALL users
exports.adminBroadcast = async (req, res) => {
    const { title, message, type } = req.body;
    try {
        if (req.user.role !== 'admin') {
            return sendError(res, 'Truy cap bi tu choi: Chi danh cho Admin', 403);
        }

        const users = await User.findAll({ attributes: ['id'] });
        const notifications = users.map((user) => ({
            user_id: user.id,
            title: title || 'Broadcast',
            type: type || 'SYSTEM_BROADCAST',
            message: title ? `[${title}] ${message}` : message,
            isRead: false
        }));

        const createdNotifications = await Notification.bulkCreate(notifications, { returning: true });

        const io = require('../config/socket').getIO();
        createdNotifications.forEach((notification) => {
            io.to(notification.user_id).emit('NEW_NOTIFICATION', serializeNotification(notification));
        });

        success(res, null, `Da gui thong bao toi ${users.length} nguoi dung thanh cong`);
    } catch (err) {
        console.error('Broadcast error:', err);
        serverError(res, 'Loi Server');
    }
};
