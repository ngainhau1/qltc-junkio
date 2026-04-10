const { body, param, validationResult, matchedData } = require('express-validator');

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
    if (locations.includes('params')) {
        req.params = matchedData(req, { locations: ['params'], includeOptionals: true });
    }
    next();
};

exports.validateCreateWallet = [
    body('name').trim().escape().isLength({ min: 2, max: 100 }).withMessage('Tên ví phải từ 2-100 ký tự'),
    body('balance').optional().isFloat({ min: 0 }).withMessage('Số dư phải >= 0').toFloat(),
    body('currency').optional().trim().escape().isLength({ min: 2, max: 10 }),
    body('family_id').optional({ nullable: true }).isUUID().withMessage('family_id phải là UUID'),
    handleValidation(['body'])
];

exports.validateUpdateWallet = [
    param('id').isUUID().withMessage('id phải là UUID'),
    body('name').optional().trim().escape().isLength({ min: 2, max: 100 }),
    body('balance').optional().isFloat({ min: 0 }).toFloat(),
    body('currency').optional().trim().escape().isLength({ min: 2, max: 10 }),
    body('family_id').optional({ nullable: true }).isUUID().withMessage('family_id phải là UUID'),
    handleValidation(['params', 'body'])
];

exports.validateDeleteWallet = [
    param('id').isUUID().withMessage('id phải là UUID'),
    handleValidation(['params'])
];
