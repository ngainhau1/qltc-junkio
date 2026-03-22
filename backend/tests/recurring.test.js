const request = require('supertest');
const express = require('express');
const { Sequelize, DataTypes, Op } = require('sequelize');

// Setup mock DB & model
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
    balance: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 }
});

const mockTransaction = mockSequelize.define('Transaction', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    amount: { type: DataTypes.DECIMAL(15, 2) },
    date: { type: DataTypes.DATEONLY },
    user_id: { type: DataTypes.UUID },
    wallet_id: { type: DataTypes.UUID },
    category_id: { type: DataTypes.UUID },
    type: { type: DataTypes.STRING },
    description: { type: DataTypes.STRING }
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
    let userId, walletId, patternId;

    beforeAll(async () => {
        await mockSequelize.sync({ force: true });
        const crypto = require('crypto');
        userId = crypto.randomUUID();

        const w = await mockWallet.create({ name: 'Cash', balance: 5000 });
        walletId = w.id;
    });

    afterAll(async () => {
        await mockSequelize.close();
    });

    describe('POST /api/recurring', () => {
        it('should return 400 if missing fields', async () => {
            mockUserId = userId;
            const res = await request(app).post('/api/recurring').send({
                amount: 100
                // Missing wallet_id, frequency, next_run_date
            });
            expect(res.statusCode).toEqual(422);
            expect(res.body.errors.length).toBeGreaterThan(0);
        });

        it('should create a new recurring pattern', async () => {
            mockUserId = userId;
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            const reqData = {
                wallet_id: walletId,
                amount: 500,
                type: 'EXPENSE',
                frequency: 'MONTHLY',
                next_run_date: tomorrow.toISOString().split('T')[0],
                description: 'Netflix Subscription'
            };

            const res = await request(app).post('/api/recurring').send(reqData);
            expect(res.statusCode).toEqual(201);
            expect(res.body.data.description).toBe('Netflix Subscription');
            expect(res.body.data.amount).toBe(500);

            patternId = res.body.data.id;
        });
    });

    describe('GET /api/recurring', () => {
        it('should get all patterns for the user', async () => {
            mockUserId = userId;
            const res = await request(app).get('/api/recurring');
            expect(res.statusCode).toEqual(200);
            expect(res.body.data.length).toBe(1);
            expect(res.body.data[0].id).toBe(patternId);
        });
    });

    describe('PUT /api/recurring/:id', () => {
        it('should return 404 for alien pattern', async () => {
            mockUserId = require('crypto').randomUUID(); // Alien user
            const res = await request(app).put(`/api/recurring/${patternId}`).send({ amount: 600 });
            expect(res.statusCode).toEqual(404);
            expect(res.body.message).toMatch(/Không tìm thấy/);
        });

        it('should update the recurring pattern correctly', async () => {
            mockUserId = userId;
            const res = await request(app).put(`/api/recurring/${patternId}`).send({
                amount: 600,
                is_active: false
            });
            expect(res.statusCode).toEqual(200);
            expect(res.body.data.amount).toBe(600);
            expect(res.body.data.is_active).toBe(false);
        });
    });

    describe('POST /api/recurring/trigger-cron', () => {
        it('should not process inactive patterns', async () => {
            // Pattern relies on is_active = false now
            const res = await request(app).post('/api/recurring/trigger-cron');
            expect(res.statusCode).toEqual(200);
            expect(res.body.message).toMatch(/Không có giao dịch/);
        });

        it('should execute active patterns and update balance', async () => {
            // 1. Reset pattern to active and due today
            const todayStr = new Date().toISOString().split('T')[0];
            await mockRecurringPattern.update({ is_active: true, next_run_date: todayStr }, { where: { id: patternId } });

            // 2. Clear prev tx records just in case
            await mockTransaction.destroy({ where: {} });

            // 3. Trigger cron
            const res = await request(app).post('/api/recurring/trigger-cron');
            expect(res.statusCode).toEqual(200);
            expect(res.body.message).toMatch(/Đã chạy thành công 1/);

            // 4. Verify transaction created
            const txs = await mockTransaction.findAll();
            expect(txs.length).toBe(1);
            expect(Number(txs[0].amount)).toBe(600); // from previous update

            // 5. Verify wallet deducted
            const wallet = await mockWallet.findByPk(walletId);
            expect(Number(wallet.balance)).toBe(5000 - 600);

            // 6. Verify next_run_date was bumped
            const p = await mockRecurringPattern.findByPk(patternId);
            expect(p.next_run_date).not.toBe(todayStr); // MONTHLY shifts it
        });
    });

    describe('DELETE /api/recurring/:id', () => {
        it('should delete the recurring pattern', async () => {
            mockUserId = userId;
            const res = await request(app).delete(`/api/recurring/${patternId}`);
            expect(res.statusCode).toEqual(200);
            expect(res.body.message).toMatch(/Xóa giao dịch/);

            const count = await mockRecurringPattern.count({ where: { id: patternId } });
            expect(count).toBe(0);
        });
    });
});
