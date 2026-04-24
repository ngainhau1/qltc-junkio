/**
 * Standard API response helpers.
 * Error responses must return stable codes in `message`.
 */

exports.success = (res, data, message = 'SUCCESS', statusCode = 200) => {
    return res.status(statusCode).json({
        status: 'success',
        message,
        data,
    });
};

exports.error = (res, message = 'ERROR', statusCode = 400, data = null) => {
    return res.status(statusCode).json({
        status: 'error',
        message,
        data,
    });
};

exports.unauthorized = (res, message = 'UNAUTHORIZED') => exports.error(res, message, 401);

exports.forbidden = (res, message = 'FORBIDDEN') => exports.error(res, message, 403);

exports.notFound = (res, message = 'RESOURCE_NOT_FOUND') => exports.error(res, message, 404);

exports.serverError = (res, message = 'INTERNAL_SERVER_ERROR') => exports.error(res, message, 500);

exports.created = (res, data, message = 'CREATED') => exports.success(res, data, message, 201);
