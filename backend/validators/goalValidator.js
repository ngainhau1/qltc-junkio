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

exports.validateCreateGoal = [
    body('name').trim().escape().isLength({ min: 2, max: 120 }).withMessage('Tên mục tiêu phải từ 2-120 ký tự'),
    body('targetAmount').isFloat({ gt: 0 }).withMessage('targetAmount phải > 0').toFloat(),
    body('currentAmount').optional().isFloat({ min: 0 }).toFloat(),
    body('deadline').optional().isISO8601().withMessage('deadline phải là ISO-8601'),
    body('colorCode').optional().trim().escape(),
    body('imageUrl').optional().trim().escape(),
    handleValidation(['body'])
];

exports.validateUpdateGoal = [
    param('id').isUUID().withMessage('id phải là UUID'),
    body('name').optional().trim().escape().isLength({ min: 2, max: 120 }),
    body('targetAmount').optional().isFloat({ gt: 0 }).toFloat(),
    body('currentAmount').optional().isFloat({ min: 0 }).toFloat(),
    body('deadline').optional().isISO8601(),
    body('colorCode').optional().trim().escape(),
    body('imageUrl').optional().trim().escape(),
    handleValidation(['params', 'body'])
];

exports.validateDepositGoal = [
    param('id').isUUID().withMessage('id phải là UUID'),
    body('amount').isFloat({ gt: 0 }).withMessage('amount phải > 0').toFloat(),
    body('wallet_id').isUUID().withMessage('wallet_id phải là UUID'),
    handleValidation(['params', 'body'])
];

exports.validateDeleteGoal = [
    param('id').isUUID().withMessage('id phải là UUID'),
    handleValidation(['params'])
];
