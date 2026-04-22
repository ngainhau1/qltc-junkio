const { body } = require('express-validator');
const { buildValidationHandler, createValidationCode } = require('./validationHelper');

exports.validateRegister = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage(createValidationCode('name', 'REQUIRED'))
        .bail()
        .isLength({ min: 2 })
        .withMessage(createValidationCode('name', 'MIN_LENGTH_NOT_MET')),
    body('email')
        .isEmail()
        .withMessage(createValidationCode('email', 'INVALID_EMAIL'))
        .normalizeEmail(),
    body('password')
        .isLength({ min: 6 })
        .withMessage(createValidationCode('password', 'MIN_LENGTH_NOT_MET')),
    buildValidationHandler(['body']),
];

exports.validateLogin = [
    body('email')
        .isEmail()
        .withMessage(createValidationCode('email', 'INVALID_EMAIL'))
        .normalizeEmail(),
    body('password')
        .exists()
        .withMessage(createValidationCode('password', 'REQUIRED')),
    buildValidationHandler(['body']),
];

exports.validateForgotPassword = [
    body('email')
        .isEmail()
        .withMessage(createValidationCode('email', 'INVALID_EMAIL'))
        .normalizeEmail(),
    buildValidationHandler(['body']),
];

exports.validateResetPassword = [
    body('password')
        .isLength({ min: 6 })
        .withMessage(createValidationCode('password', 'MIN_LENGTH_NOT_MET')),
    buildValidationHandler(['body']),
];
