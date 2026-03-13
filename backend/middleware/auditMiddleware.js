const { AuditLog } = require('../models');

/**
 * Middleware để tự động ghi log các hành động quan trọng
 * @param {string} action - Tên hành động (vd: 'USER_LOGIN', 'ROLE_CHANGED')
 * @param {string} entityType - Loại object bị tác động (vd: 'USER', 'TRANSACTION')
 */
const audit = (action, entityType = null) => {
    return async (req, res, next) => {
        // Lưu lại phương thức gốc json/send để chặn trước khi trả về
        const originalJson = res.json;
        const originalSend = res.send;

        // Hành động ghi log sẽ xảy ra sau khi request đã được xử lý (tránh ghi log nếu lỗi)
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
    // Chỉ ghi log nếu request thành công (status 2xx)
    if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
            const userId = req.user?.id || (responseBody && responseBody.user?.id); // req.user (nếu auth middleware đã chạy) hoặc từ responseBody (như login)
            let entityId = req.params?.id || req.body?.id || null;

            // Xử lý một số action đặc biệt cần lấy entityId từ body
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
            // Không làm sập app nếu vụ ghi log bị lỗi
        }
    }
};

module.exports = audit;
