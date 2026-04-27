const success = (res, data = null, message = 'SUCCESS', status = 200) => {
    return res.status(status).json({ status: 'success', message, data });
};

const error = (res, message = 'ERROR', status = 400, errors = null) => {
    return res.status(status).json({ status: 'error', message, errors, data: null });
};

module.exports = { success, error };
