const { body, param } = require('express-validator');
const { buildValidationHandler, createValidationCode } = require('./validationHelper');

// GHI CHÚ HỌC TẬP - Phần quản trị của Thành Đạt:
// Validator admin bảo vệ các thao tác nhạy cảm như xem/sửa/xóa user.
// Controller vẫn kiểm quy tắc nghiệp vụ như không tự khóa hoặc tự đổi quyền chính mình.

// Các thao tác theo user đều cần id dạng UUID trên URL.
exports.validateUserParam = [
    param('id').isUUID().withMessage(createValidationCode('id', 'INVALID_UUID')),
    buildValidationHandler(['params']),
];

// Đổi quyền cần id hợp lệ và role mới thuộc danh sách hệ thống cho phép.
exports.validateChangeRole = [
    param('id').isUUID().withMessage(createValidationCode('id', 'INVALID_UUID')),
    body('role')
        .isIn(['member', 'staff', 'admin'])
        .withMessage(createValidationCode('role', 'INVALID_ENUM')),
    buildValidationHandler(['params', 'body']),
];
