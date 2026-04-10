const { body, param, validationResult, matchedData } = require('express-validator');

const handleValidation = (locations = ['body']) => (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }
    if (locations.includes('body')) {
        req.body = matchedData(req, { locations: ['body'], includeOptionals: true });
        Object.keys(req.body).forEach((key) => {
            if (req.body[key] === undefined) {
                delete req.body[key];
            }
        });
    }
    if (locations.includes('params')) {
        req.params = matchedData(req, { locations: ['params'], includeOptionals: true });
        Object.keys(req.params).forEach((key) => {
            if (req.params[key] === undefined) {
                delete req.params[key];
            }
        });
    }
    next();
};

const familyIdValidator = body('family_id')
    .optional({ nullable: true })
    .customSanitizer((value) => (value === '' ? null : value))
    .custom((value) => value === null || /^[0-9a-fA-F-]{36}$/.test(value))
    .withMessage('family_id phai la UUID hoac null');

const dateOrderValidator = body('end_date').custom((value, { req }) => {
    if (value && req.body.start_date && new Date(value) < new Date(req.body.start_date)) {
        throw new Error('end_date phai sau hoac bang start_date');
    }
    return true;
});

exports.validateCreateBudget = [
    body('category_id').isUUID().withMessage('category_id phai la UUID'),
    familyIdValidator,
    body('amount_limit').isFloat({ gt: 0 }).withMessage('amount_limit phai > 0').toFloat(),
    body('start_date').isISO8601().withMessage('start_date phai la ISO-8601'),
    body('end_date').isISO8601().withMessage('end_date phai la ISO-8601'),
    dateOrderValidator,
    handleValidation(['body'])
];

exports.validateUpdateBudget = [
    param('id').isUUID().withMessage('id phai la UUID'),
    body('category_id').optional().isUUID().withMessage('category_id phai la UUID'),
    familyIdValidator,
    body('amount_limit').optional().isFloat({ gt: 0 }).withMessage('amount_limit phai > 0').toFloat(),
    body('start_date').optional().isISO8601().withMessage('start_date phai la ISO-8601'),
    body('end_date').optional().isISO8601().withMessage('end_date phai la ISO-8601'),
    dateOrderValidator,
    handleValidation(['params', 'body'])
];

exports.validateDeleteBudget = [
    param('id').isUUID().withMessage('id phai la UUID'),
    handleValidation(['params'])
];
