const { body, param } = require('express-validator');
const { buildValidationHandler, createValidationCode } = require('./validationHelper');

// GHI CHÚ HỌC TẬP - Phần ví của Thành Đạt:
// Validator bảo vệ API ví trước dữ liệu sai định dạng. Controller vẫn kiểm quyền,
// còn file này tập trung kiểm name, balance, currency, family_id và id trên URL.

// Tạo ví yêu cầu name hợp lệ; balance/currency/family_id là tùy chọn nhưng nếu gửi phải đúng dạng.
exports.validateCreateWallet = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage(createValidationCode('name', 'REQUIRED'))
        .bail()
        .isLength({ min: 2 })
        .withMessage(createValidationCode('name', 'MIN_LENGTH_NOT_MET'))
        .bail()
        .escape()
        .isLength({ max: 100 })
        .withMessage(createValidationCode('name', 'MAX_LENGTH_EXCEEDED')),
    body('balance')
        .optional()
        .isFloat({ min: 0 })
        .withMessage(createValidationCode('balance', 'INVALID_RANGE'))
        .toFloat(),
    body('currency')
        .optional()
        .trim()
        .isLength({ min: 2 })
        .withMessage(createValidationCode('currency', 'MIN_LENGTH_NOT_MET'))
        .bail()
        .escape()
        .isLength({ max: 10 })
        .withMessage(createValidationCode('currency', 'MAX_LENGTH_EXCEEDED')),
    body('family_id')
        .optional({ nullable: true })
        .isUUID()
        .withMessage(createValidationCode('family_id', 'INVALID_UUID')),
    buildValidationHandler(['body']),
];

// Sửa ví yêu cầu id hợp lệ; các field trong body là tùy chọn vì user có thể chỉ đổi tên hoặc số dư.
exports.validateUpdateWallet = [
    param('id').isUUID().withMessage(createValidationCode('id', 'INVALID_UUID')),
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2 })
        .withMessage(createValidationCode('name', 'MIN_LENGTH_NOT_MET'))
        .bail()
        .escape()
        .isLength({ max: 100 })
        .withMessage(createValidationCode('name', 'MAX_LENGTH_EXCEEDED')),
    body('balance')
        .optional()
        .isFloat({ min: 0 })
        .withMessage(createValidationCode('balance', 'INVALID_RANGE'))
        .toFloat(),
    body('currency')
        .optional()
        .trim()
        .isLength({ min: 2 })
        .withMessage(createValidationCode('currency', 'MIN_LENGTH_NOT_MET'))
        .bail()
        .escape()
        .isLength({ max: 10 })
        .withMessage(createValidationCode('currency', 'MAX_LENGTH_EXCEEDED')),
    body('family_id')
        .optional({ nullable: true })
        .isUUID()
        .withMessage(createValidationCode('family_id', 'INVALID_UUID')),
    buildValidationHandler(['params', 'body']),
];

// Xóa ví chỉ cần id hợp lệ; nghiệp vụ "không xóa ví có giao dịch" nằm trong controller.
exports.validateDeleteWallet = [
    param('id').isUUID().withMessage(createValidationCode('id', 'INVALID_UUID')),
    buildValidationHandler(['params']),
];
