const { body } = require('express-validator');
const { buildValidationHandler, createValidationCode } = require('./validationHelper');

exports.validateUpdateProfile = [
    body('name')
        .optional()
        .trim()
        .notEmpty()
        .withMessage(createValidationCode('name', 'REQUIRED'))
        .bail()
        .escape()
        .isLength({ max: 100 })
        .withMessage(createValidationCode('name', 'MAX_LENGTH_EXCEEDED')),
    buildValidationHandler(['body']),
];

exports.validateChangePassword = [
    body('currentPassword')
        .notEmpty()
        .withMessage(createValidationCode('currentPassword', 'REQUIRED')),
    body('newPassword')
        .isLength({ min: 6 })
        .withMessage(createValidationCode('newPassword', 'MIN_LENGTH_NOT_MET')),
    buildValidationHandler(['body']),
];

exports.validateDeleteAccount = [
    body('password')
        .notEmpty()
        .withMessage(createValidationCode('password', 'REQUIRED')),
    buildValidationHandler(['body']),
];
