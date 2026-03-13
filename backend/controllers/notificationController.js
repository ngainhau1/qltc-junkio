const { Notification, User } = require('../models');

// User fetches their notifications
exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.findAll({
            where: { user_id: req.user.id },
            order: [['created_at', 'DESC']],
            limit: 50
        });
        res.json(notifications);
    } catch (err) {
        console.error('Fetch notifications error:', err);
        res.status(500).send('Server Error');
    }
};

// User marks all notification as read
exports.markAllAsRead = async (req, res) => {
    try {
        await Notification.update(
            { isRead: true },
            { where: { user_id: req.user.id, isRead: false } }
        );
        res.json({ msg: 'All notifications marked as read' });
    } catch (err) {
        console.error('Mark read error:', err);
        res.status(500).send('Server Error');
    }
};

// User marks a single notification as read
exports.markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOne({
            where: { id: req.params.id, user_id: req.user.id }
        });

        if (!notification) {
            return res.status(404).json({ msg: 'Notification not found' });
        }

        notification.isRead = true;
        await notification.save();

        res.json({ msg: 'Notification marked as read' });
    } catch (err) {
        console.error('Mark read error:', err);
        res.status(500).send('Server Error');
    }
};

// Admin broadcasts a notification to ALL users
exports.adminBroadcast = async (req, res) => {
    const { title, message, type } = req.body;
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied: Admins only' });
        }

        const users = await User.findAll({ attributes: ['id'] });
        const notifications = users.map(u => ({
            user_id: u.id,
            type: type || 'SYSTEM_BROADCAST',
            message: title ? `[${title}] ${message}` : message,
            isRead: false
        }));

        await Notification.bulkCreate(notifications);

        // Realtime emit
        const io = require('../config/socket').getIO();
        users.forEach(u => {
            io.to(u.id).emit('NEW_NOTIFICATION', {
                type: type || 'SYSTEM_BROADCAST',
                message: title ? `[${title}] ${message}` : message,
                created_at: new Date()
            });
        });

        res.json({ msg: `Broadcasted to ${users.length} users successfully` });
    } catch (err) {
        console.error('Broadcast error:', err);
        res.status(500).send('Server Error');
    }
};
