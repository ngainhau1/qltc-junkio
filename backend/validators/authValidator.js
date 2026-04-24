const { body } = require('express-validator');
const { buildValidationHandler, createValidationCode } = require('./validationHelper');

// GHI CHÚ HỌC TẬP - Phần xác thực của Thành Đạt:
// Validator chặn dữ liệu sai trước khi vào controller. Nhờ vậy controller chỉ tập trung vào nghiệp vụ.
// createValidationCode tạo mã lỗi thống nhất để frontend dịch ra thông báo dễ hiểu.

// Đăng ký yêu cầu tên, email đúng dạng và mật khẩu tối thiểu 6 ký tự.
exports.validateRegister = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage(createValidationCode('name', 'REQUIRED'))
        .bail()
        .isLength({ min: 2 })
        .withMessage(createValidationCode('name', 'MIN_LENGTH_NOT_MET')),
    body('email')
        .isEmail()
        .withMessage(createValidationCode('email', 'INVALID_EMAIL'))
        .normalizeEmail(),
    body('password')
        .isLength({ min: 6 })
        .withMessage(createValidationCode('password', 'MIN_LENGTH_NOT_MET')),
    buildValidationHandler(['body']),
];

// Đăng nhập chỉ cần email đúng dạng và có mật khẩu.
exports.validateLogin = [
    body('email')
        .isEmail()
        .withMessage(createValidationCode('email', 'INVALID_EMAIL'))
        .normalizeEmail(),
    body('password')
        .exists()
        .withMessage(createValidationCode('password', 'REQUIRED')),
    buildValidationHandler(['body']),
];

// Quên mật khẩu chỉ cần email hợp lệ để hệ thống gửi link khôi phục.
exports.validateForgotPassword = [
    body('email')
        .isEmail()
        .withMessage(createValidationCode('email', 'INVALID_EMAIL'))
        .normalizeEmail(),
    buildValidationHandler(['body']),
];

// Đặt lại mật khẩu chỉ kiểm tra mật khẩu mới; token được lấy từ params trong route.
exports.validateResetPassword = [
    body('password')
        .isLength({ min: 6 })
        .withMessage(createValidationCode('password', 'MIN_LENGTH_NOT_MET')),
    buildValidationHandler(['body']),
];
