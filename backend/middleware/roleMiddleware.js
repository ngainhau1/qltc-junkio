const { forbidden } = require('../utils/responseHelper');

// GHI CHÚ HỌC TẬP - Phần quản trị của Thành Đạt:
// Middleware này chạy sau authMiddleware. authMiddleware gắn req.user,
// còn roleMiddleware kiểm tra req.user.role có nằm trong danh sách được phép hay không.

module.exports = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            // Không có thông tin user/role thì không cho vào khu vực cần quyền.
            return forbidden(res, 'FORBIDDEN');
        }

        if (!allowedRoles.includes(req.user.role)) {
            // Có đăng nhập nhưng không đủ vai trò cũng bị chặn.
            return forbidden(res, 'FORBIDDEN');
        }

        return next();
    };
};
