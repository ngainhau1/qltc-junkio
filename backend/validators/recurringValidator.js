const { body, param, validationResult, matchedData } = require('express-validator');

const handleValidation = (locations = ['body']) => (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }
    if (locations.includes('body')) {
        req.body = matchedData(req, { locations: ['body'], includeOptionals: true });
    }
    if (locations.includes('params')) {
        req.params = matchedData(req, { locations: ['params'], includeOptionals: true });
    }
    next();
};

exports.validateCreateRecurring = [
    body('wallet_id').isUUID().withMessage('wallet_id phải là UUID'),
    body('category_id').optional({ nullable: true }).isUUID().withMessage('category_id phải là UUID'),
    body('amount').isFloat({ gt: 0 }).withMessage('Số tiền phải > 0').toFloat(),
    body('type').optional().isIn(['INCOME', 'EXPENSE']).withMessage('Loại phải là INCOME hoặc EXPENSE'),
    body('description').optional().trim().escape().isLength({ max: 255 }),
    body('frequency').isIn(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']).withMessage('Tần suất không hợp lệ'),
    body('next_run_date').isISO8601().withMessage('next_run_date phải là ngày hợp lệ'),
    handleValidation(['body'])
];

exports.validateUpdateRecurring = [
    param('id').isUUID().withMessage('id phải là UUID'),
    body('amount').optional().isFloat({ gt: 0 }).toFloat(),
    body('frequency').optional().isIn(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']),
    body('is_active').optional().isBoolean(),
    body('next_run_date').optional().isISO8601(),
    body('description').optional().trim().escape().isLength({ max: 255 }),
    handleValidation(['params', 'body'])
];

exports.validateDeleteRecurring = [
    param('id').isUUID().withMessage('id phải là UUID'),
    handleValidation(['params'])
];
