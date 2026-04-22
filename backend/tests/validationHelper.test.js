const express = require('express');
const request = require('supertest');
const { body } = require('express-validator');
const { buildValidationHandler, createValidationCode } = require('../validators/validationHelper');

describe('validationHelper', () => {
    const app = express();

    app.use(express.json());
    app.post(
        '/date',
        [
            body('date')
                .isISO8601()
                .withMessage(createValidationCode('date', 'INVALID_ISO8601'))
                .bail()
                .toDate(),
            buildValidationHandler(['body']),
        ],
        (req, res) => {
            res.status(200).json({
                isDate: req.body.date instanceof Date,
                iso: req.body.date.toISOString(),
            });
        }
    );

    it('preserves valid Date objects produced by express-validator sanitizers', async () => {
        const res = await request(app)
            .post('/date')
            .send({ date: '2026-04-22' });

        expect(res.statusCode).toBe(200);
        expect(res.body.isDate).toBe(true);
        expect(res.body.iso).toContain('2026-04-22');
    });

    it('returns validation errors for invalid date input before reaching the handler', async () => {
        const res = await request(app)
            .post('/date')
            .send({ date: '22-Apr-2026' });

        expect(res.statusCode).toBe(422);
        expect(res.body).toEqual(expect.objectContaining({
            status: 'error',
            message: 'VALIDATION_FAILED',
            data: null,
        }));
        expect(res.body.errors).toContainEqual(expect.objectContaining({
            field: 'date',
            location: 'body',
            code: 'VALIDATION_DATE_INVALID_ISO8601',
        }));
    });
});
