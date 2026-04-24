const { success, error } = require('../utils/response');

// Attach standardized helpers to response object
module.exports = (req, res, next) => {
    res.success = (data, message = 'SUCCESS', status = 200) => success(res, data, message, status);
    res.error = (message = 'ERROR', status = 400, errors = null) => error(res, message, status, errors);
    next();
};
