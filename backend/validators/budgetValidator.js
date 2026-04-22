const { body, param } = require('express-validator');
const { buildValidationHandler, createValidationCode } = require('./validationHelper');

const familyIdValidator = body('family_id')
    .optional({ nullable: true })
    .customSanitizer((value) => (value === '' ? null : value))
    .custom((value) => value === null || /^[0-9a-fA-F-]{36}$/.test(value))
    .withMessage(createValidationCode('family_id', 'INVALID_NULLABLE_UUID'));

const dateOrderValidator = body('end_date').custom((value, { req }) => {
    if (value && req.body.start_date && new Date(value) < new Date(req.body.start_date)) {
        throw new Error(createValidationCode('end_date', 'MUST_BE_AFTER_OR_EQUAL_START_DATE'));
    }
    return true;
});

exports.validateCreateBudget = [
    body('category_id')
        .isUUID()
        .withMessage(createValidationCode('category_id', 'INVALID_UUID')),
    familyIdValidator,
    body('amount_limit')
        .isFloat({ gt: 0 })
        .withMessage(createValidationCode('amount_limit', 'MUST_BE_POSITIVE'))
        .toFloat(),
    body('start_date')
        .isISO8601()
        .withMessage(createValidationCode('start_date', 'INVALID_ISO8601')),
    body('end_date')
        .isISO8601()
        .withMessage(createValidationCode('end_date', 'INVALID_ISO8601')),
    dateOrderValidator,
    buildValidationHandler(['body']),
];

exports.validateUpdateBudget = [
    param('id').isUUID().withMessage(createValidationCode('id', 'INVALID_UUID')),
    body('category_id')
        .optional()
        .isUUID()
        .withMessage(createValidationCode('category_id', 'INVALID_UUID')),
    familyIdValidator,
    body('amount_limit')
        .optional()
        .isFloat({ gt: 0 })
        .withMessage(createValidationCode('amount_limit', 'MUST_BE_POSITIVE'))
        .toFloat(),
    body('start_date')
        .optional()
        .isISO8601()
        .withMessage(createValidationCode('start_date', 'INVALID_ISO8601')),
    body('end_date')
        .optional()
        .isISO8601()
        .withMessage(createValidationCode('end_date', 'INVALID_ISO8601')),
    dateOrderValidator,
    buildValidationHandler(['params', 'body']),
];

exports.validateDeleteBudget = [
    param('id').isUUID().withMessage(createValidationCode('id', 'INVALID_UUID')),
    buildValidationHandler(['params']),
];
