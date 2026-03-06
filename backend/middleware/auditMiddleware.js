const { AuditLog } = require('../models');

// Middleware ghi log hành động
const auditLogMiddleware = (action, entityType) => {
    return async (req, res, next) => {
        // Lưu trữ con trỏ hàm send gốc của Express
        const originalSend = res.send;

        res.send = function (body) {
            // Chờ cho request xử lý thành công (Status 200, 201) mới log
            if (res.statusCode >= 200 && res.statusCode < 300) {
                // Tách biệt luồng chạy ngầm để không làm chậm response
                (async () => {
                    try {
                        const user_id = req.user ? req.user.id : null;
                        const family_id = req.body.family_id || req.query.family_id || null;
                        const entity_id = req.params.id || (body.data && body.data.id) || null;
                        const ip_address = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

                        // Chỉ log nếu có dính líu đến giao dịch family
                        if (family_id) {
                            await AuditLog.create({
                                user_id,
                                family_id,
                                action, // Vd: 'UPDATE', 'DELETE'
                                entity_type: entityType, // Vd: 'TRANSACTION'
                                entity_id: entity_id ? String(entity_id) : null,
                                new_value: req.body,
                                ip_address
                            });
                        }
                    } catch (error) {
                        console.error('Lỗi khi ghi Audit Log:', error);
                    }
                })();
            }

            // Gọi hàm send gốc để trả về kết quả
            originalSend.call(this, body);
        };

        next();
    };
};

module.exports = auditLogMiddleware;
