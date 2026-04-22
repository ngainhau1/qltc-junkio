const { body, param } = require('express-validator');
const { buildValidationHandler, createValidationCode } = require('./validationHelper');

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

exports.validateDeleteWallet = [
    param('id').isUUID().withMessage(createValidationCode('id', 'INVALID_UUID')),
    buildValidationHandler(['params']),
];
