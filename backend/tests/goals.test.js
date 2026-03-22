const request = require('supertest');
const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');

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

// Setup db & mock models
const mockSequelize = new Sequelize('sqlite::memory:', { logging: false });

const mockGoal = mockSequelize.define('Goal', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING },
    targetAmount: { type: DataTypes.DECIMAL(15, 2) },
    currentAmount: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
    deadline: { type: DataTypes.DATE },
    colorCode: { type: DataTypes.STRING },
    imageUrl: { type: DataTypes.STRING },
    status: { type: DataTypes.STRING, defaultValue: 'IN_PROGRESS' },
    user_id: { type: DataTypes.STRING },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
    timestamps: false
});

const mockWallet = mockSequelize.define('Wallet', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING },
    balance: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
    user_id: { type: DataTypes.STRING }
});

const mockTransaction = mockSequelize.define('Transaction', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    user_id: { type: DataTypes.STRING },
    wallet_id: { type: DataTypes.UUID },
    amount: { type: DataTypes.DECIMAL(15, 2) },
    type: { type: DataTypes.STRING }, // 'INCOME', 'EXPENSE'
    description: { type: DataTypes.STRING },
    date: { type: DataTypes.DATE }
});

// Relationships
mockTransaction.belongsTo(mockWallet, { foreignKey: 'wallet_id' });

jest.mock('../models/index', () => ({
    sequelize: mockSequelize,
    Goal: mockGoal,
    Wallet: mockWallet,
    Transaction: mockTransaction
}));

// We also need to mock `../models` since controller uses it directly: `const { Goal, Wallet, Transaction } = require('../models');`
jest.mock('../models', () => ({
    sequelize: mockSequelize,
    Goal: mockGoal,
    Wallet: mockWallet,
    Transaction: mockTransaction
}));

const goalRoutes = require('../routes/goalRoutes');

const app = express();
app.use(express.json());
app.use('/api/goals', goalRoutes);

describe('Goal API Endpoints', () => {
    let testGoalId, testWalletId;

    beforeAll(async () => {
        await mockSequelize.sync({ force: true });
        
        // Setup initial data
        const g = await mockGoal.create({
            name: 'Buy iPhone 16',
            targetAmount: 30000000,
            currentAmount: 10000000,
            deadline: '2025-12-31',
            user_id: 'user-1'
        });
        testGoalId = g.id;

        const w = await mockWallet.create({
            name: 'Main Wallet',
            balance: 50000000,
            user_id: 'user-1'
        });
        testWalletId = w.id;
    });

    afterAll(async () => {
        await mockSequelize.close();
    });

    describe('GET /api/goals', () => {
        it('should return 200 and list personal goals', async () => {
            const res = await request(app).get('/api/goals');
            if (res.statusCode !== 200) console.log('DEBUG:', res.body);
            expect(res.statusCode).toEqual(200);
            expect(res.body.data).toBeInstanceOf(Array);
            expect(res.body.data.length).toEqual(1);
            expect(Number(res.body.data[0].targetAmount)).toEqual(30000000);
        });
    });

    describe('POST /api/goals', () => {
        it('should create a new goal successfully', async () => {
            const res = await request(app).post('/api/goals').send({
                name: 'Travel to Japan',
                targetAmount: 50000000,
                deadline: '2026-06-01'
            });
            expect(res.statusCode).toEqual(201);
            expect(res.body.data.name).toEqual('Travel to Japan');
            expect(Number(res.body.data.targetAmount)).toEqual(50000000);
            expect(res.body.data.status).toEqual('IN_PROGRESS');
        });

        it('should return 422 if targetAmount <= 0', async () => {
            const res = await request(app).post('/api/goals').send({
                name: 'Bad Goal',
                targetAmount: -100
            });
            expect(res.statusCode).toEqual(422);
            expect(res.body.errors[0].msg).toMatch(/targetAmount phải > 0/);
        });

        it('should return 422 if name is too short', async () => {
            const res = await request(app).post('/api/goals').send({
                name: 'x', // < 2 chars
                targetAmount: 100
            });
            expect(res.statusCode).toEqual(422);
            expect(res.body.errors[0].msg).toMatch(/Tên mục tiêu phải từ 2-120 ký tự/);
        });
    });

    describe('PUT /api/goals/:id', () => {
        it('should update goal details', async () => {
            const res = await request(app).put(`/api/goals/${testGoalId}`).send({
                name: 'Buy iPhone 16 Pro Max',
                targetAmount: 35000000
            });
            expect(res.statusCode).toEqual(200);
            expect(res.body.data.name).toEqual('Buy iPhone 16 Pro Max');
            expect(Number(res.body.data.targetAmount)).toEqual(35000000);
        });

        it('should return 404 for alien goal', async () => {
            const crypto = require('crypto');
            const res = await request(app).put(`/api/goals/${crypto.randomUUID()}`).send({
                name: 'Alien Goal'
            });
            expect(res.statusCode).toEqual(404);
            expect(res.body.message).toMatch(/Mục tiêu không tồn tại/);
        });
    });

    describe('POST /api/goals/:id/deposit', () => {
        it('should deposit money into goal and update wallet balance', async () => {
            const depositAmount = 5000000;
            const res = await request(app).post(`/api/goals/${testGoalId}/deposit`).send({
                amount: depositAmount,
                wallet_id: testWalletId
            });
            
            expect(res.statusCode).toEqual(200);
            expect(res.body.message).toMatch(/Nạp tiền vào mục tiêu thành công/);
            
            // Check goal balance in DB correctly? The result object is the updated goal
            expect(Number(res.body.data.currentAmount)).toEqual(15000000); // 10M + 5M

            // Check wallet balance
            const w = await mockWallet.findByPk(testWalletId);
            expect(Number(w.balance)).toEqual(45000000); // 50M - 5M

            // Check transaction log
            const txs = await mockTransaction.findAll();
            expect(txs.length).toBeGreaterThan(0);
            expect(txs[0].type).toEqual('EXPENSE');
            expect(Number(txs[0].amount)).toEqual(depositAmount);
        });

        it('should return 400 if wallet balance is insufficient', async () => {
            const res = await request(app).post(`/api/goals/${testGoalId}/deposit`).send({
                amount: 100000000, // 100M
                wallet_id: testWalletId
            });
            
            expect(res.statusCode).toEqual(400);
            expect(res.body.message).toMatch(/Số dư ví không đủ/);
        });

        it('should return 422 if amount is negative', async () => {
            const res = await request(app).post(`/api/goals/${testGoalId}/deposit`).send({
                amount: -500,
                wallet_id: testWalletId
            });
            
            expect(res.statusCode).toEqual(422);
            expect(res.body.errors[0].msg).toMatch(/amount phải > 0/);
        });
    });

    describe('DELETE /api/goals/:id', () => {
        let deleteId;

        beforeAll(async () => {
            const g = await mockGoal.create({
                name: 'To delete',
                user_id: 'user-1'
            });
            deleteId = g.id;
        });

        it('should delete goal successfully', async () => {
            const res = await request(app).delete(`/api/goals/${deleteId}`);
            expect(res.statusCode).toEqual(200);
            expect(res.body.message).toMatch(/Đã xóa mục tiêu thành công/);

            const getRes = await mockGoal.findByPk(deleteId);
            expect(getRes).toBeNull();
        });
    });
});
