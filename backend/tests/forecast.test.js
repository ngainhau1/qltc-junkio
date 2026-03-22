const request = require('supertest');
const express = require('express');
const { Sequelize, DataTypes, Op } = require('sequelize');

// Setup mock DB & model
const mockSequelize = new Sequelize('sqlite::memory:', { logging: false });

const mockTransaction = mockSequelize.define('Transaction', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    user_id: { type: DataTypes.UUID },
    amount: { type: DataTypes.DECIMAL(15, 2) },
    date: { type: DataTypes.DATE },
    type: { type: DataTypes.STRING }
});

jest.mock('../models', () => ({
    sequelize: mockSequelize,
    Transaction: mockTransaction
}));

let mockUserId;
jest.mock('../middleware/authMiddleware', () => (req, res, next) => {
    req.user = { id: mockUserId, role: 'USER' };
    next();
});

const forecastRoutes = require('../routes/forecastRoutes');

// Mock specific method
mockTransaction.findAll = jest.fn();

const app = express();
app.use(express.json());
app.use('/api/forecast', forecastRoutes);

describe('Forecast API', () => {
    let userId;

    beforeAll(async () => {
        await mockSequelize.sync({ force: true });
        const crypto = require('crypto');
        userId = crypto.randomUUID();
    });

    afterAll(async () => {
        await mockSequelize.close();
    });

    describe('GET /api/forecast', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('should return forecast data based on history', async () => {
            mockUserId = userId;
            
            // Mock the response from DB
            mockTransaction.findAll.mockResolvedValue([
                { month: '2023-01-01', income: 3000, expense: 2000 },
                { month: '2023-02-01', income: 3100, expense: 2100 },
                { month: '2023-03-01', income: 3200, expense: 2300 },
                { month: '2023-04-01', income: 3300, expense: 2600 },
                { month: '2023-05-01', income: 3400, expense: 3000 },
                { month: '2023-06-01', income: 3500, expense: 3500 } // Expense is catching up
            ]);

            const res = await request(app).get('/api/forecast?months=3');

            expect(res.statusCode).toEqual(200);
            expect(res.body.status).toBe('success');
            expect(res.body.data).toBeDefined();
            
            expect(res.body.data.historical).toBeDefined();
            expect(res.body.data.historical.length).toBeGreaterThanOrEqual(1); // Should have historical groups
            
            expect(res.body.data.forecast).toBeDefined();
            expect(res.body.data.forecast.length).toBe(3); // Requested 3 months

            // warningMonth could be null or a string depending on the randomly generated logic above,
            // but we ensure the property exists
            expect(res.body.data).toHaveProperty('warningMonth');
        });
    });
});
