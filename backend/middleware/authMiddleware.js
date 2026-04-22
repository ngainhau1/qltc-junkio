const jwt = require('jsonwebtoken');
const { error: sendError } = require('../utils/responseHelper');

const jwtSecret =
    process.env.JWT_SECRET || (process.env.NODE_ENV === 'test' ? 'test-secret' : undefined);

const authMiddleware = (req, res, next) => {
    if (!jwtSecret) {
        return sendError(res, 'JWT_SECRET_MISSING', 500);
    }

    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return sendError(res, 'AUTH_TOKEN_MISSING', 401);
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, jwtSecret);
        req.user = decoded.user;
        return next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return sendError(res, 'SESSION_EXPIRED', 401);
        }

        return sendError(res, 'AUTH_TOKEN_INVALID', 401);
    }
};

module.exports = authMiddleware;
