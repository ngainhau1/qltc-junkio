const { Notification, User } = require('../models');
const { success, error: sendError, notFound, serverError } = require('../utils/responseHelper');
const { serializeNotification } = require('../utils/notificationPresenter');

exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.findAll({
            where: { user_id: req.user.id },
            order: [['created_at', 'DESC']],
            limit: 50,
        });

        return success(
            res,
            notifications.map(serializeNotification),
            'NOTIFICATION_LIST_FETCH_SUCCESS'
        );
    } catch (error) {
        console.error('Fetch notifications error:', error);
        return serverError(res, 'NOTIFICATION_LOAD_FAILED');
    }
};

exports.markAllAsRead = async (req, res) => {
    try {
        await Notification.update(
            { isRead: true },
            { where: { user_id: req.user.id, isRead: false } }
        );

        return success(res, null, 'NOTIFICATION_MARK_ALL_READ_SUCCESS');
    } catch (error) {
        console.error('Mark all read error:', error);
        return serverError(res, 'NOTIFICATION_UPDATE_FAILED');
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOne({
            where: { id: req.params.id, user_id: req.user.id },
        });

        if (!notification) {
            return notFound(res, 'NOTIFICATION_NOT_FOUND');
        }

        notification.isRead = true;
        await notification.save();

        return success(
            res,
            serializeNotification(notification),
            'NOTIFICATION_MARK_READ_SUCCESS'
        );
    } catch (error) {
        console.error('Mark read error:', error);
        return serverError(res, 'NOTIFICATION_UPDATE_FAILED');
    }
};

exports.adminBroadcast = async (req, res) => {
    const { title, message, type } = req.body;

    try {
        if (req.user.role !== 'admin') {
            return sendError(res, 'FORBIDDEN', 403);
        }

        const users = await User.findAll({ attributes: ['id'] });
        const notifications = users.map((user) => ({
            user_id: user.id,
            title: title || 'Broadcast',
            type: type || 'SYSTEM_BROADCAST',
            message: title ? `[${title}] ${message}` : message,
            isRead: false,
        }));

        const createdNotifications = await Notification.bulkCreate(notifications, {
            returning: true,
        });

        const io = require('../config/socket').getIO();
        createdNotifications.forEach((notification) => {
            io.to(notification.user_id).emit('NEW_NOTIFICATION', serializeNotification(notification));
        });

        return success(res, null, 'NOTIFICATION_BROADCAST_SUCCESS');
    } catch (error) {
        console.error('Broadcast error:', error);
        return serverError(res, 'NOTIFICATION_BROADCAST_FAILED');
    }
};
