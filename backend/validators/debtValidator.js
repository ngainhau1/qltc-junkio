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

exports.validateSettle = [
    body('to_user_id').isUUID().withMessage('to_user_id phải là UUID'),
    body('amount').isFloat({ gt: 0 }).withMessage('Số tiền phải > 0').toFloat(),
    body('from_wallet_id').isUUID().withMessage('from_wallet_id phải là UUID'),
    body('to_wallet_id').isUUID().withMessage('to_wallet_id phải là UUID'),
    handleValidation(['body'])
];

exports.validateShareParam = [
    param('shareId').isUUID().withMessage('shareId phải là UUID'),
    handleValidation(['params'])
];
