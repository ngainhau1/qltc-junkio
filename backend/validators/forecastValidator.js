const { query } = require('express-validator');
const { buildValidationHandler, createValidationCode } = require('./validationHelper');

exports.validateForecastQuery = [
    query('months')
        .optional()
        .isInt({ min: 1, max: 12 })
        .withMessage(createValidationCode('months', 'INVALID_RANGE'))
        .toInt(),
    buildValidationHandler(['query']),
];
