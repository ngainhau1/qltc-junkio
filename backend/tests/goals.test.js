const request = require('supertest');
const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');

jest.mock('uuid', () => {
    const crypto = require('crypto');
    return {
        v4: () => crypto.randomUUID(),
    };
});

jest.mock('../middleware/authMiddleware', () => (req, res, next) => {
    req.user = { id: 'user-1', email: 'test@example.com', role: 'USER' };
    next();
});

const mockSequelize = new Sequelize('sqlite::memory:', { logging: false });

const mockGoal = mockSequelize.define(
    'Goal',
    {
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
        updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
        timestamps: false,
    }
);

const mockWallet = mockSequelize.define('Wallet', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING },
    balance: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
    user_id: { type: DataTypes.STRING },
    family_id: { type: DataTypes.UUID, allowNull: true },
});

const mockTransaction = mockSequelize.define('Transaction', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    user_id: { type: DataTypes.STRING },
    wallet_id: { type: DataTypes.UUID },
    family_id: { type: DataTypes.UUID, allowNull: true },
    amount: { type: DataTypes.DECIMAL(15, 2) },
    type: { type: DataTypes.STRING },
    description: { type: DataTypes.STRING },
    date: { type: DataTypes.DATE },
});

mockTransaction.belongsTo(mockWallet, { foreignKey: 'wallet_id' });

jest.mock('../models', () => ({
    sequelize: mockSequelize,
    Goal: mockGoal,
    Wallet: mockWallet,
    Transaction: mockTransaction,
}));

const goalRoutes = require('../routes/goalRoutes');

const app = express();
app.use(express.json());
app.use('/api/goals', goalRoutes);

describe('Goal API Endpoints', () => {
    let testGoalId;
    let personalWalletId;
    let familyWalletId;

    beforeAll(async () => {
        await mockSequelize.sync({ force: true });

        const goal = await mockGoal.create({
            name: 'Buy iPhone 16',
            targetAmount: 30000000,
            currentAmount: 10000000,
            deadline: '2025-12-31',
            user_id: 'user-1',
        });
        testGoalId = goal.id;

        const personalWallet = await mockWallet.create({
            name: 'Main Wallet',
            balance: 50000000,
            user_id: 'user-1',
        });
        personalWalletId = personalWallet.id;

        const familyWallet = await mockWallet.create({
            name: 'Family Wallet',
            balance: 90000000,
            user_id: 'user-1',
            family_id: '7c3fc358-157d-4614-9720-f5a74c76b9b4',
        });
        familyWalletId = familyWallet.id;
    });

    afterAll(async () => {
        await mockSequelize.close();
    });

    describe('GET /api/goals', () => {
        it('returns personal goals', async () => {
            const res = await request(app).get('/api/goals');
            expect(res.statusCode).toEqual(200);
            expect(res.body.data).toBeInstanceOf(Array);
            expect(res.body.data).toHaveLength(1);
            expect(Number(res.body.data[0].targetAmount)).toEqual(30000000);
        });
    });

    describe('POST /api/goals', () => {
        it('creates a new goal successfully', async () => {
            const res = await request(app).post('/api/goals').send({
                name: 'Travel to Japan',
                targetAmount: 50000000,
                deadline: '2026-06-01',
            });

            expect(res.statusCode).toEqual(201);
            expect(res.body.data.name).toEqual('Travel to Japan');
            expect(Number(res.body.data.targetAmount)).toEqual(50000000);
            expect(res.body.data.status).toEqual('IN_PROGRESS');
        });

        it('returns 422 if targetAmount <= 0', async () => {
            const res = await request(app).post('/api/goals').send({
                name: 'Bad Goal',
                targetAmount: -100,
            });

            expect(res.statusCode).toEqual(422);
            expect(res.body.message).toEqual('VALIDATION_FAILED');
            expect(res.body.errors[0]).toEqual(
                expect.objectContaining({
                    field: 'targetAmount',
                    code: 'VALIDATION_TARGET_AMOUNT_MUST_BE_POSITIVE',
                })
            );
        });
    });

    describe('PUT /api/goals/:id', () => {
        it('updates goal details', async () => {
            const res = await request(app).put(`/api/goals/${testGoalId}`).send({
                name: 'Buy iPhone 16 Pro Max',
                targetAmount: 35000000,
            });

            expect(res.statusCode).toEqual(200);
            expect(res.body.data.name).toEqual('Buy iPhone 16 Pro Max');
            expect(Number(res.body.data.targetAmount)).toEqual(35000000);
        });

        it('returns 404 for an alien goal', async () => {
            const crypto = require('crypto');
            const res = await request(app).put(`/api/goals/${crypto.randomUUID()}`).send({
                name: 'Alien Goal',
            });

            expect(res.statusCode).toEqual(404);
            expect(res.body.message).toEqual('GOAL_NOT_FOUND');
        });
    });

    describe('POST /api/goals/:id/deposit', () => {
        it('deposits money into goal and updates wallet balance', async () => {
            const depositAmount = 5000000;
            const res = await request(app).post(`/api/goals/${testGoalId}/deposit`).send({
                amount: depositAmount,
                wallet_id: personalWalletId,
            });

            expect(res.statusCode).toEqual(200);
            expect(res.body.message).toEqual('GOAL_DEPOSIT_SUCCESS');
            expect(Number(res.body.data.currentAmount)).toEqual(15000000);
            expect(res.body.data.sourceWallet.id).toEqual(personalWalletId);
            expect(Number(res.body.data.sourceWallet.balance)).toEqual(45000000);

            const wallet = await mockWallet.findByPk(personalWalletId);
            expect(Number(wallet.balance)).toEqual(45000000);

            const transactions = await mockTransaction.findAll();
            expect(transactions.length).toBeGreaterThan(0);
            expect(transactions[0].type).toEqual('EXPENSE');
            expect(Number(transactions[0].amount)).toEqual(depositAmount);
        });

        it('rejects deposits from family wallets', async () => {
            const res = await request(app).post(`/api/goals/${testGoalId}/deposit`).send({
                amount: 1000,
                wallet_id: familyWalletId,
            });

            expect(res.statusCode).toEqual(403);
            expect(res.body.message).toEqual('WALLET_PERSONAL_ONLY');
        });

        it('returns 400 if wallet balance is insufficient', async () => {
            const res = await request(app).post(`/api/goals/${testGoalId}/deposit`).send({
                amount: 100000000,
                wallet_id: personalWalletId,
            });

            expect(res.statusCode).toEqual(400);
            expect(res.body.message).toEqual('INSUFFICIENT_BALANCE');
        });
    });

    describe('DELETE /api/goals/:id', () => {
        let deleteId;

        beforeAll(async () => {
            const goal = await mockGoal.create({
                name: 'To delete',
                user_id: 'user-1',
            });
            deleteId = goal.id;
        });

        it('deletes goal successfully', async () => {
            const res = await request(app).delete(`/api/goals/${deleteId}`);
            expect(res.statusCode).toEqual(200);
            expect(res.body.message).toEqual('GOAL_DELETED');

            const deletedGoal = await mockGoal.findByPk(deleteId);
            expect(deletedGoal).toBeNull();
        });
    });
});
