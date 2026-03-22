const { body, validationResult, matchedData } = require('express-validator');

const handleValidation = (locations = ['body']) => (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }
    if (locations.includes('body')) {
        req.body = matchedData(req, { locations: ['body'], includeOptionals: true });
    }
    next();
};

exports.validateUpdateProfile = [
    body('name').optional().trim().escape().isLength({ min: 1, max: 100 }).withMessage('Tên phải từ 1-100 ký tự'),
    handleValidation(['body'])
];

exports.validateChangePassword = [
    body('currentPassword').notEmpty().withMessage('Vui lòng nhập mật khẩu hiện tại'),
    body('newPassword').isLength({ min: 6 }).withMessage('Mật khẩu mới phải có ít nhất 6 ký tự'),
    handleValidation(['body'])
];
