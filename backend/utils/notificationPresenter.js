const serializeNotification = (notification) => {
    if (!notification) {
        return null;
    }

    const raw = typeof notification.get === 'function'
        ? notification.get({ plain: true })
        : notification;

    const title = raw.title || raw.type || 'Notification';
    const createdAt = raw.created_at || raw.createdAt || new Date();
    const isRead = Boolean(raw.isRead ?? raw.is_read ?? false);

    return {
        id: raw.id,
        title,
        message: raw.message,
        type: raw.type || 'SYSTEM_NOTIFICATION',
        created_at: createdAt,
        createdAt,
        is_read: isRead,
        isRead
    };
};

module.exports = {
    serializeNotification
};
