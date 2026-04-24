const jwt = require('jsonwebtoken');
const { error: sendError } = require('../utils/responseHelper');

// GHI CHÚ HỌC TẬP - Phần xác thực của Thành Đạt:
// Middleware này bảo vệ các API cần đăng nhập. Nó đọc Bearer token từ header,
// xác thực JWT, rồi gắn thông tin người dùng vào req.user cho controller phía sau dùng.

const jwtSecret =
    process.env.JWT_SECRET || (process.env.NODE_ENV === 'test' ? 'test-secret' : undefined);

const authMiddleware = (req, res, next) => {
    if (!jwtSecret) {
        // Thiếu JWT_SECRET là lỗi cấu hình server, không phải lỗi người dùng.
        return sendError(res, 'JWT_SECRET_MISSING', 500);
    }

    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // Header phải có dạng: Authorization: Bearer <access_token>.
        return sendError(res, 'AUTH_TOKEN_MISSING', 401);
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, jwtSecret);
        // Các middleware/controller sau có thể dùng req.user.id và req.user.role để kiểm quyền.
        req.user = decoded.user;
        return next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            // Frontend sẽ dùng mã lỗi này để thử refresh token hoặc yêu cầu đăng nhập lại.
            return sendError(res, 'SESSION_EXPIRED', 401);
        }

        return sendError(res, 'AUTH_TOKEN_INVALID', 401);
    }
};

module.exports = authMiddleware;
