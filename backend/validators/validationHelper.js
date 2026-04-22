const { matchedData, validationResult } = require('express-validator');

const isPlainObject = (value) => {
    if (!value || typeof value !== 'object') {
        return false;
    }

    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
};

const pruneUndefined = (value) => {
    if (Array.isArray(value)) {
        return value
            .map((item) => pruneUndefined(item))
            .filter((item) => item !== undefined);
    }

    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? undefined : value;
    }

    if (isPlainObject(value)) {
        return Object.entries(value).reduce((accumulator, [key, nestedValue]) => {
            const prunedValue = pruneUndefined(nestedValue);
            if (prunedValue !== undefined) {
                accumulator[key] = prunedValue;
            }
            return accumulator;
        }, {});
    }

    return value === undefined ? undefined : value;
};

const normalizeSegment = (segment) => {
    return segment
        .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
        .replace(/[^a-zA-Z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .toUpperCase();
};

const createValidationCode = (fieldPath, rule) => {
    const normalizedField = String(fieldPath || 'FIELD')
        .replace(/\[(\d+)\]/g, '.$1')
        .replace(/\[\*\]/g, '.*')
        .split('.')
        .filter((segment) => segment && segment !== '*' && !/^\d+$/.test(segment))
        .map(normalizeSegment)
        .filter(Boolean)
        .join('_');

    return `VALIDATION_${normalizedField || 'FIELD'}_${rule}`;
};

const buildValidationHandler = (locations = ['body']) => {
    return (req, res, next) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(422).json({
                status: 'error',
                message: 'VALIDATION_FAILED',
                data: null,
                errors: errors.array().map((detail) => ({
                    field: detail.path || detail.param || '',
                    location: detail.location,
                    code: String(detail.msg || 'VALIDATION_ERROR'),
                })),
            });
        }

        locations.forEach((location) => {
            req[location] = pruneUndefined(
                matchedData(req, {
                    locations: [location],
                    includeOptionals: true,
                })
            );
        });

        return next();
    };
};

module.exports = {
    buildValidationHandler,
    createValidationCode,
};
