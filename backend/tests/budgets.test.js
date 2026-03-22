const request = require('supertest');
const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');

jest.mock('uuid', () => {
    const crypto = require('crypto');
    return {
        v4: () => crypto.randomUUID()
    };
});

jest.mock('../middleware/authMiddleware', () => (req, res, next) => {
    req.user = { id: 'user-1', email: 'test@example.com', role: 'USER' };
    next();
});

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
    start_date: { type: DataTypes.DATEONLY },
    end_date: { type: DataTypes.DATEONLY },
    category_id: { type: DataTypes.UUID },
    family_id: { type: DataTypes.UUID, allowNull: true },
    user_id: { type: DataTypes.STRING, allowNull: true }
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
    let testCategory;
    let accessibleFamilyId;
    let inaccessibleFamilyId;
    let personalBudgetId;
    let familyBudgetId;

    beforeAll(async () => {
        await mockSequelize.sync({ force: true });

        testCategory = await mockCategory.create({ name: 'Groceries', icon: 'Cart' });

        const member = await mockFamilyMember.create({ user_id: 'user-1' });
        accessibleFamilyId = member.family_id;
        inaccessibleFamilyId = 'c9e7f95e-9e30-4c9f-b8b5-289466845555';

        const personalBudget = await mockBudget.create({
            amount_limit: 3000,
            start_date: '2025-01-01',
            end_date: '2025-01-31',
            category_id: testCategory.id,
            user_id: 'user-1'
        });
        personalBudgetId = personalBudget.id;

        const familyBudget = await mockBudget.create({
            amount_limit: 5000,
            start_date: '2025-02-01',
            end_date: '2025-02-28',
            category_id: testCategory.id,
            family_id: accessibleFamilyId
        });
        familyBudgetId = familyBudget.id;

        await mockBudget.create({
            amount_limit: 9000,
            start_date: '2025-03-01',
            end_date: '2025-03-31',
            category_id: testCategory.id,
            family_id: inaccessibleFamilyId
        });

        await mockBudget.create({
            amount_limit: 1200,
            start_date: '2025-04-01',
            end_date: '2025-04-30',
            category_id: testCategory.id,
            user_id: 'user-2'
        });
    });

    afterAll(async () => {
        await mockSequelize.close();
    });

    describe('GET /api/budgets', () => {
        it('returns personal and accessible family budgets only', async () => {
            const res = await request(app).get('/api/budgets');
            expect(res.statusCode).toEqual(200);
            expect(res.body.data).toBeInstanceOf(Array);
            expect(res.body.data).toHaveLength(2);
            expect(res.body.data.every((budget) => budget.Category)).toBe(true);
        });
    });

    describe('POST /api/budgets', () => {
        it('creates a personal budget when family_id is omitted', async () => {
            const res = await request(app).post('/api/budgets').send({
                amount_limit: 2000,
                start_date: '2025-05-01',
                end_date: '2025-05-31',
                category_id: testCategory.id
            });

            expect(res.statusCode).toEqual(201);
            expect(res.body.data.user_id).toEqual('user-1');
            expect(res.body.data.family_id).toBeNull();
        });

        it('creates a family budget when family_id is accessible', async () => {
            const res = await request(app).post('/api/budgets').send({
                amount_limit: 2500,
                start_date: '2025-06-01',
                end_date: '2025-06-30',
                category_id: testCategory.id,
                family_id: accessibleFamilyId
            });

            expect(res.statusCode).toEqual(201);
            expect(res.body.data.family_id).toEqual(accessibleFamilyId);
            expect(res.body.data.user_id).toBeNull();
        });

        it('rejects family budget creation for inaccessible family', async () => {
            const res = await request(app).post('/api/budgets').send({
                amount_limit: 2500,
                start_date: '2025-06-01',
                end_date: '2025-06-30',
                category_id: testCategory.id,
                family_id: inaccessibleFamilyId
            });

            expect(res.statusCode).toEqual(403);
            expect(res.body.message).toMatch(/Ban khong thuoc family nay/);
        });

        it('returns 422 if amount_limit <= 0', async () => {
            const res = await request(app).post('/api/budgets').send({
                amount_limit: -50,
                start_date: '2025-02-01',
                end_date: '2025-02-28',
                category_id: testCategory.id
            });
            expect(res.statusCode).toEqual(422);
            expect(res.body.errors[0].msg).toMatch(/amount_limit phai > 0/);
        });
    });

    describe('PUT /api/budgets/:id', () => {
        it('updates an accessible personal budget', async () => {
            const res = await request(app).put(`/api/budgets/${personalBudgetId}`).send({
                amount_limit: 3600
            });

            expect(res.statusCode).toEqual(200);
            expect(res.body.data.amount_limit).toEqual(3600);
            expect(res.body.data.user_id).toEqual('user-1');
        });

        it('can move a personal budget into an accessible family scope', async () => {
            const res = await request(app).put(`/api/budgets/${personalBudgetId}`).send({
                family_id: accessibleFamilyId
            });

            expect(res.statusCode).toEqual(200);
            expect(res.body.data.family_id).toEqual(accessibleFamilyId);
            expect(res.body.data.user_id).toBeNull();
        });

        it('returns 404 for an inaccessible budget', async () => {
            const alienBudget = await mockBudget.findOne({ where: { family_id: inaccessibleFamilyId } });
            const res = await request(app).put(`/api/budgets/${alienBudget.id}`).send({
                amount_limit: 999
            });

            expect(res.statusCode).toEqual(404);
            expect(res.body.message).toMatch(/Ngan sach khong ton tai/);
        });
    });

    describe('DELETE /api/budgets/:id', () => {
        it('deletes an accessible family budget', async () => {
            const res = await request(app).delete(`/api/budgets/${familyBudgetId}`);
            expect(res.statusCode).toEqual(200);
            expect(res.body.message).toMatch(/Da xoa ngan sach thanh cong/);

            const deletedBudget = await mockBudget.findByPk(familyBudgetId);
            expect(deletedBudget).toBeNull();
        });
    });
});
