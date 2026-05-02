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
    body('phone')
        .optional({ nullable: true })
        .trim()
        .isLength({ max: 32 })
        .withMessage(createValidationCode('phone', 'MAX_LENGTH_EXCEEDED'))
        .bail()
        .custom((value) => {
            if (value === '' || /^[0-9+\-()\s]+$/.test(value)) {
                return true;
            }

            throw new Error(createValidationCode('phone', 'INVALID_FORMAT'));
        }),
    body('dateOfBirth')
        .optional({ nullable: true })
        .custom((value) => {
            if (value === '') {
                return true;
            }

            if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
                throw new Error(createValidationCode('dateOfBirth', 'INVALID_ISO8601'));
            }

            const parsed = new Date(`${value}T00:00:00.000Z`);
            if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
                throw new Error(createValidationCode('dateOfBirth', 'INVALID_ISO8601'));
            }

            const today = new Date().toISOString().slice(0, 10);
            if (value > today) {
                throw new Error(createValidationCode('dateOfBirth', 'MUST_NOT_BE_FUTURE'));
            }
            return true;
        }),
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
