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

exports.validateBroadcast = [
    body('title').optional().trim().isLength({ max: 100 }).withMessage('Tiêu đề quá dài'),
    body('message').trim().isLength({ min: 1, max: 500 }).withMessage('Nội dung phải từ 1-500 ký tự'),
    body('type').optional().trim().escape().isLength({ max: 50 }),
    handleValidation(['body'])
];

exports.validateNotificationParam = [
    param('id').isUUID().withMessage('id phải là UUID'),
    handleValidation(['params'])
];
