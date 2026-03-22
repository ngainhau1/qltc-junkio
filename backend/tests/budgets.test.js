const request = require('supertest');
const express = require('express');
const { Sequelize, DataTypes, Op } = require('sequelize');

// Mock uuid
jest.mock('uuid', () => {
    const crypto = require('crypto');
    return {
        v4: () => crypto.randomUUID()
    };
});

// Mock authMiddleware
jest.mock('../middleware/authMiddleware', () => (req, res, next) => {
    req.user = { id: 'user-1', email: 'test@example.com', role: 'USER' };
    next();
});

// Mock models
const mockSequelize = new Sequelize('sqlite::memory:', { logging: false });

const mockCategory = mockSequelize.define('Category', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING },
    icon: { type: DataTypes.STRING }
});

const mockFamilyMember = mockSequelize.define('FamilyMember', {
    user_id: { type: DataTypes.STRING },
    family_id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4 }
});

const mockBudget = mockSequelize.define('Budget', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    amount_limit: { type: DataTypes.FLOAT },
    start_date: { type: DataTypes.DATE },
    end_date: { type: DataTypes.DATE },
    category_id: { type: DataTypes.UUID },
    family_id: { type: DataTypes.UUID }
});

mockBudget.belongsTo(mockCategory, { foreignKey: 'category_id' });

jest.mock('../models', () => ({
    sequelize: mockSequelize,
    Budget: mockBudget,
    Category: mockCategory,
    FamilyMember: mockFamilyMember
}));

const budgetRoutes = require('../routes/budgetRoutes');

const app = express();
app.use(express.json());
app.use('/api/budgets', budgetRoutes);

describe('Budget API Endpoints', () => {
    let testCategory, familyId;

    beforeAll(async () => {
        await mockSequelize.sync({ force: true });
        
        // Setup initial data
        testCategory = await mockCategory.create({ name: 'Groceries', icon: 'Cart' });
        
        const member = await mockFamilyMember.create({ user_id: 'user-1' });
        familyId = member.family_id;

        await mockBudget.create({
            amount_limit: 5000,
            start_date: '2025-01-01',
            end_date: '2025-01-31',
            category_id: testCategory.id,
            family_id: familyId
        });
    });

    afterAll(async () => {
        await mockSequelize.close();
    });

    describe('GET /api/budgets', () => {
        it('should return 200 and list budgets for user families', async () => {
            const res = await request(app).get('/api/budgets');
            expect(res.statusCode).toEqual(200);
            expect(res.body.data).toBeInstanceOf(Array);
            expect(res.body.data.length).toEqual(1);
            expect(res.body.data[0].amount_limit).toEqual(5000);
            expect(res.body.data[0].Category).toBeDefined();
        });
    });

    describe('POST /api/budgets', () => {
        it('should create a new budget successfully', async () => {
            const res = await request(app).post('/api/budgets').send({
                amount_limit: 2000,
                start_date: '2025-02-01',
                end_date: '2025-02-28',
                category_id: testCategory.id,
                family_id: familyId
            });
            expect(res.statusCode).toEqual(201);
            expect(res.body.data.amount_limit).toEqual(2000);
        });

        it('should return 422 if amount_limit <= 0', async () => {
            const res = await request(app).post('/api/budgets').send({
                amount_limit: -50,
                start_date: '2025-02-01',
                end_date: '2025-02-28',
                category_id: testCategory.id
            });
            expect(res.statusCode).toEqual(422);
            expect(res.body.errors[0].msg).toMatch(/amount_limit phải > 0/);
        });

        it('should return 422 if end_date < start_date', async () => {
            const res = await request(app).post('/api/budgets').send({
                amount_limit: 1000,
                start_date: '2025-02-28',
                end_date: '2025-02-01', // Before start
                category_id: testCategory.id
            });
            expect(res.statusCode).toEqual(422);
            expect(res.body.errors[0].msg).toMatch(/end_date phải sau hoặc bằng start_date/);
        });
    });

    describe('PUT /api/budgets/:id', () => {
        let updateBudgetId;

        beforeAll(async () => {
            const newB = await mockBudget.create({
                amount_limit: 1000,
                start_date: '2025-03-01',
                end_date: '2025-03-31',
                category_id: testCategory.id,
                family_id: familyId
            });
            updateBudgetId = newB.id;
        });

        it('should update budget details successfully', async () => {
            const res = await request(app).put(`/api/budgets/${updateBudgetId}`).send({
                amount_limit: 3000
            });
            expect(res.statusCode).toEqual(200);
            expect(res.body.data.amount_limit).toEqual(3000);
            expect(new Date(res.body.data.start_date).toISOString()).toMatch(/^2025-03-01/);
        });

        it('should return 404 for a non-existent budget', async () => {
            const crypto = require('crypto');
            const res = await request(app).put(`/api/budgets/${crypto.randomUUID()}`).send({
                amount_limit: 500
            });
            expect(res.statusCode).toEqual(404);
            expect(res.body.message).toMatch(/Ngân sách không tồn tại/);
        });
    });

    describe('DELETE /api/budgets/:id', () => {
        let deleteBudgetId;

        beforeAll(async () => {
            const delB = await mockBudget.create({
                amount_limit: 500,
                start_date: '2025-04-01',
                end_date: '2025-04-30',
                category_id: testCategory.id,
                family_id: familyId
            });
            deleteBudgetId = delB.id;
        });

        it('should delete budget successfully', async () => {
            const res = await request(app).delete(`/api/budgets/${deleteBudgetId}`);
            expect(res.statusCode).toEqual(200);
            expect(res.body.message).toMatch(/Đã xóa ngân sách thành công/);

            const getRes = await mockBudget.findByPk(deleteBudgetId);
            expect(getRes).toBeNull();
        });
    });
});
