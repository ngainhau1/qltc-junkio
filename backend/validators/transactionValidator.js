const { body, query, param, validationResult, matchedData } = require('express-validator');

const handleValidation = (locations = ['body']) => (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const details = errors.array();
        return res.status(422).json({
            message: details[0]?.msg || 'Validation error',
            errors: details
        });
    }

    if (locations.includes('body')) {
        req.body = matchedData(req, { locations: ['body'], includeOptionals: true });
    }
    if (locations.includes('query')) {
        req.query = matchedData(req, { locations: ['query'], includeOptionals: true });
    }
    if (locations.includes('params')) {
        req.params = matchedData(req, { locations: ['params'], includeOptionals: true });
    }

    next();
};

exports.validateTransactionCreate = [
    body('wallet_id').isUUID().withMessage('wallet_id phai la UUID'),
    body('amount').isFloat({ gt: 0 }).withMessage('amount phai > 0').toFloat(),
    body('type').isIn(['INCOME', 'EXPENSE']).withMessage('type khong hop le'),
    body('category_id').optional({ nullable: true }).isUUID().withMessage('category_id phai la UUID'),
    body('family_id').optional({ nullable: true }).isUUID().withMessage('family_id phai la UUID'),
    body('date').optional().isISO8601().toDate().withMessage('date phai la ISO-8601'),
    body('description').optional().trim().escape().isLength({ max: 255 }).withMessage('description qua dai'),
    handleValidation(['body'])
];

exports.validateTransactionTransfer = [
    body('from_wallet_id').isUUID().withMessage('from_wallet_id phai la UUID'),
    body('to_wallet_id')
        .isUUID()
        .withMessage('to_wallet_id phai la UUID')
        .bail()
        .custom((toWalletId, { req }) => {
            if (toWalletId === req.body.from_wallet_id) {
                throw new Error('to_wallet_id phai khac from_wallet_id');
            }
            return true;
        }),
    body('amount').isFloat({ gt: 0 }).withMessage('amount phai > 0').toFloat(),
    body('description').optional().trim().escape().isLength({ max: 255 }),
    body('date').optional().isISO8601().toDate(),
    handleValidation(['body'])
];

exports.validateTransactionImport = [
    body('transactions').isArray({ min: 1 }).withMessage('transactions phai la mang va khong rong'),
    body('transactions.*.wallet_id').isUUID().withMessage('wallet_id phai la UUID'),
    body('transactions.*.type').isIn(['INCOME', 'EXPENSE']).withMessage('type phai la INCOME hoac EXPENSE'),
    body('transactions.*.amount').isFloat({ gt: 0 }).withMessage('amount phai > 0').toFloat(),
    body('transactions.*.category_id').optional({ nullable: true }).isUUID().withMessage('category_id phai la UUID'),
    body('transactions.*.description').optional().trim().escape().isLength({ max: 255 }),
    body('transactions.*.date').optional().isISO8601().toDate(),
    handleValidation(['body'])
];

exports.validateTransactionParams = [
    param('id').isUUID().withMessage('id phai la UUID'),
    handleValidation(['params'])
];

exports.validateTransactionQuery = [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 200 }).toInt(),
    query('type').optional().isIn(['INCOME', 'EXPENSE', 'TRANSFER_OUT', 'TRANSFER_IN']),
    query('startDate').optional().isISO8601().toDate(),
    query('endDate').optional().isISO8601().toDate(),
    query('context').optional().isIn(['personal', 'family']),
    query('family_id').optional().isUUID(),
    query('wallet_id').optional().isUUID(),
    query('category_id').optional().isUUID(),
    query('format').optional().isIn(['csv', 'pdf']),
    query('search').optional().trim().escape(),
    handleValidation(['query'])
];
