const { body, param, validationResult, matchedData } = require('express-validator');

const handleValidation = (locations = ['body']) => (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const details = errors.array();
        return res.status(422).json({
            message: details[0]?.msg || 'Validation error',
            errors: details,
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

exports.validateUserParam = [
    param('id').isUUID().withMessage('id phai la UUID'),
    handleValidation(['params']),
];

exports.validateChangeRole = [
    param('id').isUUID().withMessage('id phai la UUID'),
    body('role').isIn(['member', 'staff', 'admin']).withMessage('role khong hop le'),
    handleValidation(['params', 'body']),
];
