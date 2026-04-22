const { body, query, param } = require('express-validator');
const { buildValidationHandler, createValidationCode } = require('./validationHelper');

exports.validateTransactionCreate = [
    body('wallet_id')
        .isUUID()
        .withMessage(createValidationCode('wallet_id', 'INVALID_UUID')),
    body('amount')
        .isFloat({ gt: 0 })
        .withMessage(createValidationCode('amount', 'MUST_BE_POSITIVE'))
        .toFloat(),
    body('type')
        .isIn(['INCOME', 'EXPENSE'])
        .withMessage(createValidationCode('type', 'INVALID_ENUM')),
    body('category_id')
        .optional({ nullable: true })
        .isUUID()
        .withMessage(createValidationCode('category_id', 'INVALID_UUID')),
    body('family_id')
        .optional({ nullable: true })
        .isUUID()
        .withMessage(createValidationCode('family_id', 'INVALID_UUID')),
    body('shares')
        .optional({ nullable: true })
        .isArray()
        .withMessage(createValidationCode('shares', 'INVALID_ARRAY')),
    body('shares.*.user_id')
        .optional()
        .isUUID()
        .withMessage(createValidationCode('shares.*.user_id', 'INVALID_UUID')),
    body('shares.*.amount')
        .optional()
        .isFloat({ gt: 0 })
        .withMessage(createValidationCode('shares.*.amount', 'MUST_BE_POSITIVE'))
        .toFloat(),
    body('shares.*.status')
        .optional()
        .isIn(['PAID', 'UNPAID'])
        .withMessage(createValidationCode('shares.*.status', 'INVALID_ENUM')),
    body('shares.*.approval_status')
        .optional()
        .isIn(['APPROVED'])
        .withMessage(createValidationCode('shares.*.approval_status', 'INVALID_ENUM')),
    body('date')
        .optional()
        .isISO8601()
        .withMessage(createValidationCode('date', 'INVALID_ISO8601'))
        .bail()
        .toDate(),
    body('description')
        .optional()
        .trim()
        .escape()
        .isLength({ max: 255 })
        .withMessage(createValidationCode('description', 'MAX_LENGTH_EXCEEDED')),
    buildValidationHandler(['body']),
];

exports.validateTransactionTransfer = [
    body('from_wallet_id')
        .isUUID()
        .withMessage(createValidationCode('from_wallet_id', 'INVALID_UUID')),
    body('to_wallet_id')
        .isUUID()
        .withMessage(createValidationCode('to_wallet_id', 'INVALID_UUID'))
        .bail()
        .custom((toWalletId, { req }) => {
            if (toWalletId === req.body.from_wallet_id) {
                throw new Error(
                    createValidationCode('to_wallet_id', 'MUST_DIFFER_FROM_FROM_WALLET_ID')
                );
            }
            return true;
        }),
    body('amount')
        .isFloat({ gt: 0 })
        .withMessage(createValidationCode('amount', 'MUST_BE_POSITIVE'))
        .toFloat(),
    body('description')
        .optional()
        .trim()
        .escape()
        .isLength({ max: 255 })
        .withMessage(createValidationCode('description', 'MAX_LENGTH_EXCEEDED')),
    body('date')
        .optional()
        .isISO8601()
        .withMessage(createValidationCode('date', 'INVALID_ISO8601'))
        .bail()
        .toDate(),
    buildValidationHandler(['body']),
];

exports.validateTransactionImport = [
    body('transactions')
        .isArray({ min: 1 })
        .withMessage(createValidationCode('transactions', 'INVALID_ARRAY')),
    body('transactions.*.wallet_id')
        .isUUID()
        .withMessage(createValidationCode('transactions.*.wallet_id', 'INVALID_UUID')),
    body('transactions.*.type')
        .isIn(['INCOME', 'EXPENSE'])
        .withMessage(createValidationCode('transactions.*.type', 'INVALID_ENUM')),
    body('transactions.*.amount')
        .isFloat({ gt: 0 })
        .withMessage(createValidationCode('transactions.*.amount', 'MUST_BE_POSITIVE'))
        .toFloat(),
    body('transactions.*.category_id')
        .optional({ nullable: true })
        .isUUID()
        .withMessage(createValidationCode('transactions.*.category_id', 'INVALID_UUID')),
    body('transactions.*.description')
        .optional()
        .trim()
        .escape()
        .isLength({ max: 255 })
        .withMessage(createValidationCode('transactions.*.description', 'MAX_LENGTH_EXCEEDED')),
    body('transactions.*.date')
        .optional()
        .isISO8601()
        .withMessage(createValidationCode('transactions.*.date', 'INVALID_ISO8601'))
        .bail()
        .toDate(),
    buildValidationHandler(['body']),
];

exports.validateTransactionParams = [
    param('id').isUUID().withMessage(createValidationCode('id', 'INVALID_UUID')),
    buildValidationHandler(['params']),
];

exports.validateTransactionQuery = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage(createValidationCode('page', 'INVALID_RANGE'))
        .toInt(),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 1000 })
        .withMessage(createValidationCode('limit', 'INVALID_RANGE'))
        .toInt(),
    query('type')
        .optional()
        .isIn(['INCOME', 'EXPENSE', 'TRANSFER_OUT', 'TRANSFER_IN'])
        .withMessage(createValidationCode('type', 'INVALID_ENUM')),
    query('startDate')
        .optional()
        .isISO8601()
        .withMessage(createValidationCode('startDate', 'INVALID_ISO8601'))
        .bail()
        .toDate(),
    query('endDate')
        .optional()
        .isISO8601()
        .withMessage(createValidationCode('endDate', 'INVALID_ISO8601'))
        .bail()
        .toDate(),
    query('context')
        .optional()
        .isIn(['personal', 'family'])
        .withMessage(createValidationCode('context', 'INVALID_ENUM')),
    query('family_id')
        .optional()
        .isUUID()
        .withMessage(createValidationCode('family_id', 'INVALID_UUID')),
    query('wallet_id')
        .optional()
        .isUUID()
        .withMessage(createValidationCode('wallet_id', 'INVALID_UUID')),
    query('category_id')
        .optional()
        .isUUID()
        .withMessage(createValidationCode('category_id', 'INVALID_UUID')),
    query('format')
        .optional()
        .isIn(['csv', 'pdf'])
        .withMessage(createValidationCode('format', 'INVALID_ENUM')),
    query('search').optional().trim().escape(),
    query('sortBy')
        .optional()
        .isIn(['date', 'amount', 'type', 'created_at'])
        .withMessage(createValidationCode('sortBy', 'INVALID_ENUM')),
    query('sortOrder')
        .optional()
        .isIn(['ASC', 'DESC'])
        .withMessage(createValidationCode('sortOrder', 'INVALID_ENUM')),
    buildValidationHandler(['query']),
];
