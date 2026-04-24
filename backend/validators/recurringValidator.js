const { body, param } = require('express-validator');
const { buildValidationHandler, createValidationCode } = require('./validationHelper');

exports.validateCreateRecurring = [
    body('wallet_id')
        .isUUID()
        .withMessage(createValidationCode('wallet_id', 'INVALID_UUID')),
    body('category_id')
        .optional({ nullable: true })
        .isUUID()
        .withMessage(createValidationCode('category_id', 'INVALID_UUID')),
    body('amount')
        .isFloat({ gt: 0 })
        .withMessage(createValidationCode('amount', 'MUST_BE_POSITIVE'))
        .toFloat(),
    body('type')
        .optional()
        .isIn(['INCOME', 'EXPENSE'])
        .withMessage(createValidationCode('type', 'INVALID_ENUM')),
    body('description')
        .optional()
        .trim()
        .escape()
        .isLength({ max: 255 })
        .withMessage(createValidationCode('description', 'MAX_LENGTH_EXCEEDED')),
    body('frequency')
        .isIn(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'])
        .withMessage(createValidationCode('frequency', 'INVALID_ENUM')),
    body('next_run_date')
        .isISO8601()
        .withMessage(createValidationCode('next_run_date', 'INVALID_ISO8601')),
    buildValidationHandler(['body']),
];

exports.validateUpdateRecurring = [
    param('id').isUUID().withMessage(createValidationCode('id', 'INVALID_UUID')),
    body('amount')
        .optional()
        .isFloat({ gt: 0 })
        .withMessage(createValidationCode('amount', 'MUST_BE_POSITIVE'))
        .toFloat(),
    body('frequency')
        .optional()
        .isIn(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'])
        .withMessage(createValidationCode('frequency', 'INVALID_ENUM')),
    body('is_active')
        .optional()
        .isBoolean()
        .withMessage(createValidationCode('is_active', 'INVALID_BOOLEAN')),
    body('next_run_date')
        .optional()
        .isISO8601()
        .withMessage(createValidationCode('next_run_date', 'INVALID_ISO8601')),
    body('description')
        .optional()
        .trim()
        .escape()
        .isLength({ max: 255 })
        .withMessage(createValidationCode('description', 'MAX_LENGTH_EXCEEDED')),
    buildValidationHandler(['params', 'body']),
];

exports.validateDeleteRecurring = [
    param('id').isUUID().withMessage(createValidationCode('id', 'INVALID_UUID')),
    buildValidationHandler(['params']),
];
