const { AuditLog } = require('../models');

const audit = (action, entityType = null) => {
    return async (req, res, next) => {
        const originalJson = res.json;
        const originalSend = res.send;

        res.json = function (body) {
            logAction(req, res, body, action, entityType);
            return originalJson.call(this, body);
        };
        res.send = function (body) {
            logAction(req, res, body, action, entityType);
            return originalSend.call(this, body);
        };

        next();
    };
};

const logAction = async (req, res, responseBody, action, entityType) => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
            const userId = req.user?.id || (responseBody && responseBody.user?.id);
            let entityId = req.params?.id || req.body?.id || null;

            if (action === 'USER_LOGIN') entityId = userId;

            await AuditLog.create({
                user_id: userId,
                action: action,
                entity_type: entityType,
                entity_id: entityId,
                old_value: req.method !== 'GET' ? req.body : null,
                new_value: responseBody,
                ip_address: req.ip || req.connection.remoteAddress
            });
        } catch (error) {
            console.error('AuditLog middleware error:', error);
        }
    }
};

module.exports = audit;
