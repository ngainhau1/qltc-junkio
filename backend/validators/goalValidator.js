const { body, param } = require('express-validator');
const { buildValidationHandler, createValidationCode } = require('./validationHelper');

exports.validateCreateGoal = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage(createValidationCode('name', 'REQUIRED'))
        .bail()
        .isLength({ min: 2 })
        .withMessage(createValidationCode('name', 'MIN_LENGTH_NOT_MET'))
        .bail()
        .escape()
        .isLength({ max: 120 })
        .withMessage(createValidationCode('name', 'MAX_LENGTH_EXCEEDED')),
    body('targetAmount')
        .isFloat({ gt: 0 })
        .withMessage(createValidationCode('targetAmount', 'MUST_BE_POSITIVE'))
        .toFloat(),
    body('currentAmount')
        .optional()
        .isFloat({ min: 0 })
        .withMessage(createValidationCode('currentAmount', 'INVALID_RANGE'))
        .toFloat(),
    body('deadline')
        .optional()
        .isISO8601()
        .withMessage(createValidationCode('deadline', 'INVALID_ISO8601')),
    body('colorCode')
        .optional()
        .trim()
        .escape()
        .isLength({ max: 50 })
        .withMessage(createValidationCode('colorCode', 'MAX_LENGTH_EXCEEDED')),
    body('imageUrl')
        .optional()
        .trim()
        .escape()
        .isLength({ max: 255 })
        .withMessage(createValidationCode('imageUrl', 'MAX_LENGTH_EXCEEDED')),
    buildValidationHandler(['body']),
];

exports.validateUpdateGoal = [
    param('id').isUUID().withMessage(createValidationCode('id', 'INVALID_UUID')),
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2 })
        .withMessage(createValidationCode('name', 'MIN_LENGTH_NOT_MET'))
        .bail()
        .escape()
        .isLength({ max: 120 })
        .withMessage(createValidationCode('name', 'MAX_LENGTH_EXCEEDED')),
    body('targetAmount')
        .optional()
        .isFloat({ gt: 0 })
        .withMessage(createValidationCode('targetAmount', 'MUST_BE_POSITIVE'))
        .toFloat(),
    body('currentAmount')
        .optional()
        .isFloat({ min: 0 })
        .withMessage(createValidationCode('currentAmount', 'INVALID_RANGE'))
        .toFloat(),
    body('deadline')
        .optional()
        .isISO8601()
        .withMessage(createValidationCode('deadline', 'INVALID_ISO8601')),
    body('colorCode')
        .optional()
        .trim()
        .escape()
        .isLength({ max: 50 })
        .withMessage(createValidationCode('colorCode', 'MAX_LENGTH_EXCEEDED')),
    body('imageUrl')
        .optional()
        .trim()
        .escape()
        .isLength({ max: 255 })
        .withMessage(createValidationCode('imageUrl', 'MAX_LENGTH_EXCEEDED')),
    buildValidationHandler(['params', 'body']),
];

exports.validateDepositGoal = [
    param('id').isUUID().withMessage(createValidationCode('id', 'INVALID_UUID')),
    body('amount')
        .isFloat({ gt: 0 })
        .withMessage(createValidationCode('amount', 'MUST_BE_POSITIVE'))
        .toFloat(),
    body('wallet_id')
        .isUUID()
        .withMessage(createValidationCode('wallet_id', 'INVALID_UUID')),
    buildValidationHandler(['params', 'body']),
];

exports.validateDeleteGoal = [
    param('id').isUUID().withMessage(createValidationCode('id', 'INVALID_UUID')),
    buildValidationHandler(['params']),
];
