/**
 * Helper chuẩn hóa response API theo format:
 * { status: 'success'|'error', message: string, data: any }
 */

/**
 * Trả về response thành công
 * @param {Object} res - Express response object
 * @param {any} data - Dữ liệu trả về
 * @param {string} message - Thông báo
 * @param {number} statusCode - HTTP status code (mặc định 200)
 */
exports.success = (res, data, message = 'Thành công', statusCode = 200) => {
    return res.status(statusCode).json({
        status: 'success',
        message,
        data
    });
};

/**
 * Trả về response lỗi
 * @param {Object} res - Express response object
 * @param {string} message - Thông báo lỗi
 * @param {number} statusCode - HTTP status code (mặc định 400)
 * @param {any} data - Dữ liệu bổ sung (nếu có)
 */
exports.error = (res, message = 'Lỗi', statusCode = 400, data = null) => {
    return res.status(statusCode).json({
        status: 'error',
        message,
        data
    });
};

/**
 * Các shortcut thường dùng
 */
exports.unauthorized = (res, message = 'Vui lòng đăng nhập') =>
    exports.error(res, message, 401);

exports.forbidden = (res, message = 'Không có quyền truy cập') =>
    exports.error(res, message, 403);

exports.notFound = (res, message = 'Không tìm thấy tài nguyên') =>
    exports.error(res, message, 404);

exports.serverError = (res, message = 'Lỗi server nội bộ') =>
    exports.error(res, message, 500);

exports.created = (res, data, message = 'Tạo mới thành công') =>
    exports.success(res, data, message, 201);
