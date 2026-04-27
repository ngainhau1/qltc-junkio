const { body, param } = require('express-validator');
const { buildValidationHandler, createValidationCode } = require('./validationHelper');

// GHI CHÚ HỌC TẬP - Phần danh mục của Thành Đạt:
// Danh mục cần name và type rõ ràng để giao dịch được phân loại đúng.
// parent_id là tùy chọn, dùng khi tạo danh mục con.

// Tạo danh mục yêu cầu name và type; icon/parent_id có thể bỏ trống.
exports.validateCreateCategory = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage(createValidationCode('name', 'REQUIRED'))
        .bail()
        .escape()
        .isLength({ max: 100 })
        .withMessage(createValidationCode('name', 'MAX_LENGTH_EXCEEDED')),
    body('type')
        .isIn(['INCOME', 'EXPENSE'])
        .withMessage(createValidationCode('type', 'INVALID_ENUM')),
    body('parent_id')
        .optional({ nullable: true })
        .isUUID()
        .withMessage(createValidationCode('parent_id', 'INVALID_UUID')),
    body('icon')
        .optional()
        .trim()
        .escape()
        .isLength({ max: 50 })
        .withMessage(createValidationCode('icon', 'MAX_LENGTH_EXCEEDED')),
    buildValidationHandler(['body']),
];

// Cập nhật danh mục cho phép sửa từng phần, nhưng id trên URL luôn phải là UUID hợp lệ.
exports.validateUpdateCategory = [
    param('id').isUUID().withMessage(createValidationCode('id', 'INVALID_UUID')),
    body('name')
        .optional()
        .trim()
        .notEmpty()
        .withMessage(createValidationCode('name', 'REQUIRED'))
        .bail()
        .escape()
        .isLength({ max: 100 })
        .withMessage(createValidationCode('name', 'MAX_LENGTH_EXCEEDED')),
    body('type')
        .optional()
        .isIn(['INCOME', 'EXPENSE'])
        .withMessage(createValidationCode('type', 'INVALID_ENUM')),
    body('icon')
        .optional()
        .trim()
        .escape()
        .isLength({ max: 50 })
        .withMessage(createValidationCode('icon', 'MAX_LENGTH_EXCEEDED')),
    buildValidationHandler(['params', 'body']),
];

// Xóa danh mục chỉ cần kiểm tra id trước khi controller tìm trong DB.
exports.validateDeleteCategory = [
    param('id').isUUID().withMessage(createValidationCode('id', 'INVALID_UUID')),
    buildValidationHandler(['params']),
];
