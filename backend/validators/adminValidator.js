const { body, param } = require('express-validator');
const { buildValidationHandler, createValidationCode } = require('./validationHelper');

exports.validateUserParam = [
    param('id').isUUID().withMessage(createValidationCode('id', 'INVALID_UUID')),
    buildValidationHandler(['params']),
];

exports.validateChangeRole = [
    param('id').isUUID().withMessage(createValidationCode('id', 'INVALID_UUID')),
    body('role')
        .isIn(['member', 'staff', 'admin'])
        .withMessage(createValidationCode('role', 'INVALID_ENUM')),
    buildValidationHandler(['params', 'body']),
];
