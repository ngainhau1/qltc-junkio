const { query, validationResult, matchedData } = require('express-validator');

const handleValidation = (locations = ['query']) => (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const details = errors.array();
        return res.status(422).json({
            message: details[0]?.msg || 'Validation error',
            errors: details,
        });
    }

    if (locations.includes('query')) {
        req.query = matchedData(req, { locations: ['query'], includeOptionals: true });
    }

    return next();
};

exports.validateForecastQuery = [
    query('months')
        .optional()
        .isInt({ min: 1, max: 12 })
        .withMessage('months must be an integer between 1 and 12')
        .toInt(),
    handleValidation(['query']),
];
