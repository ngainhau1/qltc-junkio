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
    // Inject a dummy user ID that matches our test data
    req.user = { id: 'user-1' };
    next();
});

// Setup SQLite in-memory models
const mockSequelize = new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false });

const mockWallet = mockSequelize.define('Wallet', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    balance: { type: DataTypes.DECIMAL, defaultValue: 0 },
    currency: { type: DataTypes.STRING(10), defaultValue: 'VND' },
    user_id: { type: DataTypes.UUID },
    family_id: { type: DataTypes.UUID, allowNull: true }
});

const mockFamilyMember = mockSequelize.define('FamilyMember', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    user_id: { type: DataTypes.UUID },
    family_id: { type: DataTypes.UUID },
    role: { type: DataTypes.STRING, defaultValue: 'MEMBER' }
});

const mockTransaction = mockSequelize.define('Transaction', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    wallet_id: { type: DataTypes.UUID }
});

// Mock models module BEFORE requiring routes
jest.mock('../models', () => ({
    Wallet: mockWallet,
    FamilyMember: mockFamilyMember,
    Transaction: mockTransaction,
    sequelize: mockSequelize
}));

let app;
let testWalletId;

beforeAll(async () => {
    await mockSequelize.sync({ force: true });

    // Seed data
    await mockFamilyMember.create({ user_id: 'user-1', family_id: 'family-1', role: 'MEMBER' });
    
    // Personal wallet
    const w1 = await mockWallet.create({ name: 'Personal Cash', balance: 500000, user_id: 'user-1' });
    testWalletId = w1.id;

    // Family wallet
    await mockWallet.create({ name: 'Family Fund', balance: 1000000, family_id: 'family-1' });

    // Another user's wallet (should not be visible)
    await mockWallet.create({ name: 'Other Wallet', balance: 100, user_id: 'user-2' });

    const walletRoutes = require('../routes/walletRoutes');
    const responseMiddleware = require('../middleware/responseMiddleware');
    app = express();
    app.use(express.json());
    app.use(responseMiddleware);
    app.use('/api/wallets', walletRoutes);
});

afterAll(async () => {
    await mockSequelize.close();
});

describe('Wallet API Endpoints', () => {
    describe('GET /api/wallets', () => {
        it('should return 200 and list only owned or family wallets', async () => {
            const res = await request(app).get('/api/wallets');
            expect(res.statusCode).toEqual(200);
            expect(res.body.data).toBeInstanceOf(Array);
            expect(res.body.data.length).toEqual(2); // Personal + Family
            
            const names = res.body.data.map(w => w.name);
            expect(names).toContain('Personal Cash');
            expect(names).toContain('Family Fund');
            expect(names).not.toContain('Other Wallet');
        });
    });

    describe('POST /api/wallets', () => {
        it('should create a new wallet successfully', async () => {
            const res = await request(app).post('/api/wallets').send({
                name: 'New Test Wallet',
                balance: 150000,
                currency: 'USD'
            });
            expect(res.statusCode).toEqual(201);
            expect(res.body.data.name).toEqual('New Test Wallet');
            expect(parseFloat(res.body.data.balance)).toEqual(150000);
            expect(res.body.data.user_id).toEqual('user-1');
        });

        it('should return 422 for invalid data (name too short)', async () => {
            const res = await request(app).post('/api/wallets').send({ name: 'A' });
            expect(res.statusCode).toEqual(422);
            expect(res.body.errors[0].msg).toMatch(/2-100 ký tự/);
        });
    });

    describe('PUT /api/wallets/:id', () => {
        it('should update wallet name and balance', async () => {
            const res = await request(app).put(`/api/wallets/${testWalletId}`).send({
                name: 'Updated Personal Cash',
                balance: 600000
            });
            expect(res.statusCode).toEqual(200);
            expect(res.body.data.name).toEqual('Updated Personal Cash');
            expect(parseFloat(res.body.data.balance)).toEqual(600000);
        });

        it('should return 404 for an unauthorized wallet or fake ID', async () => {
            const unauthorizedId = '00000000-0000-0000-0000-000000000000';
            const res = await request(app).put(`/api/wallets/${unauthorizedId}`).send({
                name: 'Hacked'
            });
            expect(res.statusCode).toEqual(404);
        });
    });

    describe('DELETE /api/wallets/:id', () => {
        it('should return 400 if wallet has existing transactions', async () => {
            // Mock a transaction for this wallet
            await mockTransaction.create({ wallet_id: testWalletId });

            const res = await request(app).delete(`/api/wallets/${testWalletId}`);
            expect(res.statusCode).toEqual(400);
            expect(res.body.message).toMatch(/Khong the xoa vi dang co giao dich/i);
        });

        it('should delete wallet successfully after removing transactions', async () => {
            // Create a fresh wallet to delete
            const newRes = await request(app).post('/api/wallets').send({ name: 'To Be Deleted' });
            const deleteId = newRes.body.data.id;

            const res = await request(app).delete(`/api/wallets/${deleteId}`);
            expect(res.statusCode).toEqual(200);
            expect(res.body.message).toMatch(/Da xoa vi thanh cong/i);
        });
    });
});
