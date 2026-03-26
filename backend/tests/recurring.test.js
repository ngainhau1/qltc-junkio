const request = require('supertest');
const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');

const mockSequelize = new Sequelize('sqlite::memory:', { logging: false });

const mockRecurringPattern = mockSequelize.define('RecurringPattern', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    user_id: { type: DataTypes.UUID },
    wallet_id: { type: DataTypes.UUID },
    category_id: { type: DataTypes.UUID },
    amount: { type: DataTypes.DECIMAL(15, 2) },
    type: { type: DataTypes.STRING },
    description: { type: DataTypes.STRING },
    frequency: { type: DataTypes.STRING },
    next_run_date: { type: DataTypes.DATEONLY },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
});

const mockWallet = mockSequelize.define('Wallet', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING },
    balance: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
    family_id: { type: DataTypes.UUID, allowNull: true }
});

const mockTransaction = mockSequelize.define('Transaction', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    amount: { type: DataTypes.DECIMAL(15, 2) },
    date: { type: DataTypes.DATEONLY },
    user_id: { type: DataTypes.UUID },
    wallet_id: { type: DataTypes.UUID },
    category_id: { type: DataTypes.UUID },
    type: { type: DataTypes.STRING },
    description: { type: DataTypes.STRING },
    family_id: { type: DataTypes.UUID, allowNull: true }
});

jest.mock('../models', () => ({
    sequelize: mockSequelize,
    RecurringPattern: mockRecurringPattern,
    Wallet: mockWallet,
    Transaction: mockTransaction
}));

let mockUserId;
jest.mock('../middleware/authMiddleware', () => (req, res, next) => {
    req.user = { id: mockUserId, role: 'USER' };
    next();
});

const recurringRoutes = require('../routes/recurringRoutes');

const app = express();
app.use(express.json());
app.use('/api/recurring', recurringRoutes);

describe('Recurring Transactions API', () => {
    let userId;
    let walletId;
    let patternId;

    beforeAll(async () => {
        await mockSequelize.sync({ force: true });
        userId = require('crypto').randomUUID();

        const wallet = await mockWallet.create({ name: 'Cash', balance: 5000 });
        walletId = wallet.id;
    });

    afterAll(async () => {
        await mockSequelize.close();
    });

    describe('POST /api/recurring', () => {
        it('returns 422 if required fields are missing', async () => {
            mockUserId = userId;

            const res = await request(app).post('/api/recurring').send({
                amount: 100
            });

            expect(res.statusCode).toEqual(422);
            expect(res.body.errors.length).toBeGreaterThan(0);
        });

        it('creates a recurring pattern', async () => {
            mockUserId = userId;
            const tomorrow = new Date('2026-03-27T00:00:00.000Z');

            const res = await request(app).post('/api/recurring').send({
                wallet_id: walletId,
                amount: 500,
                type: 'EXPENSE',
                frequency: 'MONTHLY',
                next_run_date: tomorrow.toISOString().split('T')[0],
                description: 'Netflix Subscription'
            });

            expect(res.statusCode).toEqual(201);
            expect(res.body.data.description).toBe('Netflix Subscription');
            expect(Number(res.body.data.amount)).toBe(500);

            patternId = res.body.data.id;
        });
    });

    describe('GET /api/recurring', () => {
        it('returns patterns for the current user', async () => {
            mockUserId = userId;

            const res = await request(app).get('/api/recurring');

            expect(res.statusCode).toEqual(200);
            expect(res.body.data).toHaveLength(1);
            expect(res.body.data[0].id).toBe(patternId);
        });
    });

    describe('PUT /api/recurring/:id', () => {
        it('returns 404 for another user', async () => {
            mockUserId = require('crypto').randomUUID();

            const res = await request(app).put(`/api/recurring/${patternId}`).send({ amount: 600 });

            expect(res.statusCode).toEqual(404);
            expect(res.body.message).toMatch(/Khong tim thay/);
        });

        it('updates the pattern', async () => {
            mockUserId = userId;

            const res = await request(app).put(`/api/recurring/${patternId}`).send({
                amount: 600,
                is_active: false
            });

            expect(res.statusCode).toEqual(200);
            expect(Number(res.body.data.amount)).toBe(600);
            expect(res.body.data.is_active).toBe(false);
        });
    });

    describe('POST /api/recurring/trigger-cron', () => {
        it('returns no-op when no due active pattern exists', async () => {
            const res = await request(app).post('/api/recurring/trigger-cron');

            expect(res.statusCode).toEqual(200);
            expect(res.body.message).toMatch(/Khong co giao dich dinh ky/);
        });

        it('executes an active pattern and updates the wallet balance', async () => {
            await mockRecurringPattern.update(
                { is_active: true, next_run_date: '2026-03-26' },
                { where: { id: patternId } }
            );
            await mockTransaction.destroy({ where: {} });

            const res = await request(app).post('/api/recurring/trigger-cron');

            expect(res.statusCode).toEqual(200);
            expect(res.body.message).toMatch(/Da chay thanh cong 1/);

            const transactions = await mockTransaction.findAll();
            expect(transactions).toHaveLength(1);
            expect(Number(transactions[0].amount)).toBe(600);

            const wallet = await mockWallet.findByPk(walletId);
            expect(Number(wallet.balance)).toBe(4400);

            const pattern = await mockRecurringPattern.findByPk(patternId);
            expect(pattern.next_run_date).toBe('2026-04-26');
        });

        it('only advances an overdue pattern by one cycle', async () => {
            const overduePattern = await mockRecurringPattern.create({
                user_id: userId,
                wallet_id: walletId,
                amount: 100,
                type: 'EXPENSE',
                frequency: 'DAILY',
                next_run_date: '2026-03-20',
                description: 'Daily snack',
                is_active: true
            });

            const res = await request(app).post('/api/recurring/trigger-cron');

            expect(res.statusCode).toEqual(200);

            const updatedPattern = await mockRecurringPattern.findByPk(overduePattern.id);
            expect(updatedPattern.next_run_date).toBe('2026-03-21');
        });

        it('skips expense patterns when the wallet balance is insufficient', async () => {
            await mockRecurringPattern.update({ is_active: false }, { where: {} });

            const lowBalanceWallet = await mockWallet.create({ name: 'Low balance', balance: 50 });
            const blockedPattern = await mockRecurringPattern.create({
                user_id: userId,
                wallet_id: lowBalanceWallet.id,
                amount: 100,
                type: 'EXPENSE',
                frequency: 'DAILY',
                next_run_date: '2026-03-26',
                description: 'Too expensive',
                is_active: true
            });

            const beforeCount = await mockTransaction.count();
            const res = await request(app).post('/api/recurring/trigger-cron');

            expect(res.statusCode).toEqual(200);

            const afterCount = await mockTransaction.count();
            const updatedPattern = await mockRecurringPattern.findByPk(blockedPattern.id);
            const wallet = await mockWallet.findByPk(lowBalanceWallet.id);

            expect(afterCount).toBe(beforeCount);
            expect(updatedPattern.next_run_date).toBe('2026-03-26');
            expect(Number(wallet.balance)).toBe(50);
        });
    });

    describe('DELETE /api/recurring/:id', () => {
        it('deletes the pattern', async () => {
            mockUserId = userId;

            const res = await request(app).delete(`/api/recurring/${patternId}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.message).toMatch(/Xoa giao dich dinh ky/);

            const count = await mockRecurringPattern.count({ where: { id: patternId } });
            expect(count).toBe(0);
        });
    });
});
