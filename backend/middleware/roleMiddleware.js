const { forbidden } = require('../utils/responseHelper');

module.exports = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return forbidden(res, 'FORBIDDEN');
        }

        if (!allowedRoles.includes(req.user.role)) {
            return forbidden(res, 'FORBIDDEN');
        }

        return next();
    };
};
