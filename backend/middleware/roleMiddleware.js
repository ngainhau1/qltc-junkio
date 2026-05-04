const { forbidden } = require('../utils/responseHelper');

// Phân quyền Role - Base Access Control(RBAC). Middleware này chặn các API quản trị, 
// chỉ cho phép user có role === 'admin' đi qua. Nếu ai đó cố tình gọi API bằng Postman 
// mà không phải admin, nó sẽ trả về 403 Forbidden.

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
