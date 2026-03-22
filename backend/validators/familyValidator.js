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

exports.validateCreateFamily = [
    body('name').trim().escape().isLength({ min: 1, max: 100 }).withMessage('Tên gia đình phải từ 1-100 ký tự'),
    handleValidation(['body'])
];

exports.validateAddMember = [
    param('id').isUUID().withMessage('id gia đình phải là UUID'),
    body('email').isEmail().withMessage('Email không hợp lệ').normalizeEmail(),
    body('role').optional().isIn(['ADMIN', 'MEMBER']).withMessage('Role phải là ADMIN hoặc MEMBER'),
    handleValidation(['params', 'body'])
];

exports.validateFamilyParam = [
    param('id').isUUID().withMessage('id phải là UUID'),
    handleValidation(['params'])
];

exports.validateRemoveMember = [
    param('id').isUUID().withMessage('id gia đình phải là UUID'),
    param('userIdToRemove').isUUID().withMessage('userIdToRemove phải là UUID'),
    handleValidation(['params'])
];
