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

const dateOrderValidator = body('end_date').custom((value, { req }) => {
    if (value && req.body.start_date && new Date(value) < new Date(req.body.start_date)) {
        throw new Error('end_date phải sau hoặc bằng start_date');
    }
    return true;
});

exports.validateCreateBudget = [
    body('category_id').isUUID().withMessage('category_id phải là UUID'),
    body('family_id').optional().isUUID().withMessage('family_id phải là UUID'),
    body('amount_limit').isFloat({ gt: 0 }).withMessage('amount_limit phải > 0').toFloat(),
    body('start_date').isISO8601().withMessage('start_date phải là ISO-8601'),
    body('end_date').isISO8601().withMessage('end_date phải là ISO-8601'),
    dateOrderValidator,
    handleValidation(['body'])
];

exports.validateUpdateBudget = [
    param('id').isUUID().withMessage('id phải là UUID'),
    body('category_id').optional().isUUID(),
    body('family_id').optional().isUUID(),
    body('amount_limit').optional().isFloat({ gt: 0 }).toFloat(),
    body('start_date').optional().isISO8601(),
    body('end_date').optional().isISO8601(),
    dateOrderValidator,
    handleValidation(['params', 'body'])
];

exports.validateDeleteBudget = [
    param('id').isUUID().withMessage('id phải là UUID'),
    handleValidation(['params'])
];
