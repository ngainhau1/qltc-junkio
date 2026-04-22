const { body } = require('express-validator');
const { buildValidationHandler, createValidationCode } = require('./validationHelper');

exports.validateSettle = [
    body('to_user_id')
        .isUUID()
        .withMessage(createValidationCode('to_user_id', 'INVALID_UUID')),
    body('amount')
        .isFloat({ gt: 0 })
        .withMessage(createValidationCode('amount', 'MUST_BE_POSITIVE'))
        .toFloat(),
    body('from_wallet_id')
        .isUUID()
        .withMessage(createValidationCode('from_wallet_id', 'INVALID_UUID')),
    body('to_wallet_id')
        .optional({ nullable: true })
        .isUUID()
        .withMessage(createValidationCode('to_wallet_id', 'INVALID_UUID')),
    body('to_wallet_id').custom((value, { req }) => {
        if (!req.body.family_id && !value) {
            throw new Error(createValidationCode('to_wallet_id', 'INVALID_UUID'));
        }
        return true;
    }),
    body('from_user_id')
        .optional({ nullable: true })
        .isUUID()
        .withMessage(createValidationCode('from_user_id', 'INVALID_UUID')),
    body('family_id')
        .optional({ nullable: true })
        .isUUID()
        .withMessage(createValidationCode('family_id', 'INVALID_UUID')),
    buildValidationHandler(['body']),
];
