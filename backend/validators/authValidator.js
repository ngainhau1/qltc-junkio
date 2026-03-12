const { check, validationResult } = require('express-validator');

// Middleware xử lý kết quả validation chung
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }
    next();
};

exports.validateRegister = [
    check('name', 'Họ tên là bắt buộc và phải từ 2 ký tự trở lên').trim().isLength({ min: 2 }),
    check('email', 'Vui lòng cung cấp email hợp lệ').isEmail().normalizeEmail(),
    check('password', 'Mật khẩu phải có ít nhất 6 ký tự').isLength({ min: 6 }),
    validate
];

exports.validateLogin = [
    check('email', 'Vui lòng cung cấp email hợp lệ').isEmail().normalizeEmail(),
    check('password', 'Mật khẩu là bắt buộc').exists(),
    validate
];

exports.validateForgotPassword = [
    check('email', 'Vui lòng cung cấp email hợp lệ').isEmail().normalizeEmail(),
    validate
];

exports.validateResetPassword = [
    check('password', 'Mật khẩu mới phải có ít nhất 6 ký tự').isLength({ min: 6 }),
    validate
];
