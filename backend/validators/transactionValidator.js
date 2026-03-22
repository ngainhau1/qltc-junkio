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
    // Loại bỏ field thừa, chỉ giữ field đã validate
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
    body('wallet_id').isUUID().withMessage('wallet_id phải là UUID'),
    body('amount').isFloat({ gt: 0 }).withMessage('amount phải > 0').toFloat(),
    body('type').isIn(['INCOME', 'EXPENSE']).withMessage('type không hợp lệ'),
    body('category_id').optional({ nullable: true }).isUUID().withMessage('category_id phải là UUID'),
    body('family_id').optional({ nullable: true }).isUUID().withMessage('family_id phải là UUID'),
    body('date').optional().isISO8601().toDate().withMessage('date phải là ISO-8601'),
    body('description').optional().trim().escape().isLength({ max: 255 }).withMessage('description quá dài'),
    handleValidation(['body'])
];

exports.validateTransactionTransfer = [
    body('from_wallet_id').isUUID().withMessage('from_wallet_id phải là UUID'),
    body('to_wallet_id').isUUID().withMessage('to_wallet_id phải là UUID'),
    body('amount').isFloat({ gt: 0 }).withMessage('amount phải > 0').toFloat(),
    body('description').optional().trim().escape().isLength({ max: 255 }),
    body('date').optional().isISO8601().toDate(),
    handleValidation(['body'])
];

exports.validateTransactionImport = [
    body('transactions').isArray({ min: 1 }).withMessage('transactions phải là mảng và không rỗng'),
    body('transactions.*.wallet_id').isUUID().withMessage('wallet_id phải là UUID'),
    body('transactions.*.type').isIn(['INCOME', 'EXPENSE']).withMessage('type phải là INCOME hoặc EXPENSE'),
    body('transactions.*.amount').isFloat({ gt: 0 }).withMessage('amount phải > 0').toFloat(),
    body('transactions.*.category_id').optional({ nullable: true }).isUUID().withMessage('category_id phải là UUID'),
    body('transactions.*.description').optional().trim().escape().isLength({ max: 255 }),
    body('transactions.*.date').optional().isISO8601().toDate(),
    handleValidation(['body'])
];

exports.validateTransactionParams = [
    param('id').isUUID().withMessage('id phải là UUID'),
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
