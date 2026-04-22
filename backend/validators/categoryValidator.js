const { body, param } = require('express-validator');
const { buildValidationHandler, createValidationCode } = require('./validationHelper');

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

exports.validateDeleteCategory = [
    param('id').isUUID().withMessage(createValidationCode('id', 'INVALID_UUID')),
    buildValidationHandler(['params']),
];
