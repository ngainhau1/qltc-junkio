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

exports.validateCreateCategory = [
    body('name').trim().escape().isLength({ min: 1, max: 100 }).withMessage('Tên danh mục phải từ 1-100 ký tự'),
    body('type').isIn(['INCOME', 'EXPENSE']).withMessage('Loại phải là INCOME hoặc EXPENSE'),
    body('parent_id').optional({ nullable: true }).isUUID().withMessage('parent_id phải là UUID'),
    body('icon').optional().trim().escape().isLength({ max: 50 }),
    handleValidation(['body'])
];

exports.validateUpdateCategory = [
    param('id').isUUID().withMessage('id phải là UUID'),
    body('name').optional().trim().escape().isLength({ min: 1, max: 100 }),
    body('type').optional().isIn(['INCOME', 'EXPENSE']),
    body('icon').optional().trim().escape().isLength({ max: 50 }),
    handleValidation(['params', 'body'])
];

exports.validateDeleteCategory = [
    param('id').isUUID().withMessage('id phải là UUID'),
    handleValidation(['params'])
];
