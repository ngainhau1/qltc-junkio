const { body, param } = require('express-validator');
const { buildValidationHandler, createValidationCode } = require('./validationHelper');

exports.validateCreateFamily = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage(createValidationCode('name', 'REQUIRED'))
        .bail()
        .escape()
        .isLength({ max: 100 })
        .withMessage(createValidationCode('name', 'MAX_LENGTH_EXCEEDED')),
    buildValidationHandler(['body']),
];

exports.validateAddMember = [
    param('id').isUUID().withMessage(createValidationCode('id', 'INVALID_UUID')),
    body('email')
        .isEmail()
        .withMessage(createValidationCode('email', 'INVALID_EMAIL'))
        .normalizeEmail(),
    body('role')
        .optional()
        .isIn(['ADMIN', 'MEMBER'])
        .withMessage(createValidationCode('role', 'INVALID_ENUM')),
    buildValidationHandler(['params', 'body']),
];

exports.validateFamilyParam = [
    param('id').isUUID().withMessage(createValidationCode('id', 'INVALID_UUID')),
    buildValidationHandler(['params']),
];

exports.validateRemoveMember = [
    param('id').isUUID().withMessage(createValidationCode('id', 'INVALID_UUID')),
    param('userIdToRemove')
        .isUUID()
        .withMessage(createValidationCode('userIdToRemove', 'INVALID_UUID')),
    buildValidationHandler(['params']),
];
