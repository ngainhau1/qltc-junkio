const { body, param } = require('express-validator');
const { buildValidationHandler, createValidationCode } = require('./validationHelper');

exports.validateBroadcast = [
    body('title')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage(createValidationCode('title', 'MAX_LENGTH_EXCEEDED')),
    body('message')
        .trim()
        .notEmpty()
        .withMessage(createValidationCode('message', 'REQUIRED'))
        .bail()
        .isLength({ max: 500 })
        .withMessage(createValidationCode('message', 'MAX_LENGTH_EXCEEDED')),
    body('type')
        .optional()
        .trim()
        .escape()
        .isLength({ max: 50 })
        .withMessage(createValidationCode('type', 'MAX_LENGTH_EXCEEDED')),
    buildValidationHandler(['body']),
];

exports.validateNotificationParam = [
    param('id').isUUID().withMessage(createValidationCode('id', 'INVALID_UUID')),
    buildValidationHandler(['params']),
];
