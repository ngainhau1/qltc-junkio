// Standardized API response helpers
const success = (res, data = null, message = 'success', status = 200) => {
    return res.status(status).json({ status: 'success', message, data });
};

const error = (res, message = 'error', status = 400, errors = null) => {
    return res.status(status).json({ status: 'error', message, errors, data: null });
};

module.exports = { success, error };
