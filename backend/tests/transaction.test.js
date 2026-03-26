process.env.JWT_SECRET = 'test-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh';

const request = require('supertest');
const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');

jest.mock('uuid', () => ({
    v4: jest.fn(() => require('crypto').randomUUID())
}));

jest.mock('../middleware/uploadMiddleware', () => ({
    uploadAvatar: { single: () => (req, res, next) => next() }
}));
jest.mock('../middleware/auditMiddleware', () => () => (req, res, next) => next());

jest.mock('../middleware/authMiddleware', () => (req, res, next) => {
    req.user = { id: 'test-user-id', role: 'member' };
    next();
});

const mockSequelize = new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false });

const mockWallet = mockSequelize.define('Wallet', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    balance: { type: DataTypes.DECIMAL, defaultValue: 0 },
    user_id: { type: DataTypes.UUID },
    family_id: { type: DataTypes.UUID, allowNull: true }
});

const mockCategory = mockSequelize.define('Category', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING },
    user_id: { type: DataTypes.UUID }
});

const mockTransaction = mockSequelize.define('Transaction', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    amount: { type: DataTypes.DECIMAL },
    type: { type: DataTypes.STRING },
    description: { type: DataTypes.STRING },
    date: { type: DataTypes.DATE },
    transaction_date: { type: DataTypes.DATE },
    wallet_id: { type: DataTypes.UUID },
    category_id: { type: DataTypes.UUID },
    user_id: { type: DataTypes.UUID },
    family_id: { type: DataTypes.UUID },
    transfer_group_id: { type: DataTypes.UUID, allowNull: true }
});

const mockTransactionShare = mockSequelize.define('TransactionShare', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    transaction_id: { type: DataTypes.UUID },
    user_id: { type: DataTypes.UUID },
    amount: { type: DataTypes.DECIMAL },
    status: { type: DataTypes.STRING, defaultValue: 'UNPAID' },
    approval_status: { type: DataTypes.STRING, defaultValue: 'PENDING' }
});

const mockUser = mockSequelize.define('User', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: DataTypes.STRING,
    email: DataTypes.STRING
});

const mockFamilyMember = mockSequelize.define('FamilyMember', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    user_id: { type: DataTypes.UUID },
    family_id: { type: DataTypes.UUID }
});

mockTransaction.hasMany(mockTransactionShare, { foreignKey: 'transaction_id', as: 'Shares' });
mockTransactionShare.belongsTo(mockTransaction, { foreignKey: 'transaction_id' });
mockTransactionShare.belongsTo(mockUser, { foreignKey: 'user_id', as: 'User' });
mockTransaction.belongsTo(mockWallet, { foreignKey: 'wallet_id' });
mockTransaction.belongsTo(mockCategory, { foreignKey: 'category_id' });

jest.mock('../models', () => ({
    Transaction: mockTransaction,
    Wallet: mockWallet,
    Category: mockCategory,
    User: mockUser,
    FamilyMember: mockFamilyMember,
    sequelize: {
        transaction: (callback) => (callback ? mockSequelize.transaction(callback) : mockSequelize.transaction()),
        models: {
            TransactionShare: mockTransactionShare
        }
    }
}));

let app;
let primaryWalletId;

beforeAll(async () => {
    await mockSequelize.sync({ force: true });

    const primaryWallet = await mockWallet.create({
        name: 'Primary Wallet',
        balance: 1000000,
        user_id: 'test-user-id'
    });
    primaryWalletId = primaryWallet.id;

    const transactionRoutes = require('../routes/transactionRoutes');
    const responseMiddleware = require('../middleware/responseMiddleware');
    app = express();
    app.use(express.json());
    app.use(responseMiddleware);
    app.use('/api/transactions', transactionRoutes);
});

afterAll(async () => {
    await mockSequelize.close();
});

describe('Transaction API validation', () => {
    it('returns an error when wallet_id is missing', async () => {
        const res = await request(app)
            .post('/api/transactions')
            .send({
                amount: 50000,
                type: 'EXPENSE',
                description: 'Missing wallet'
            });

        expect([400, 422]).toContain(res.statusCode);
        expect(res.body.message || res.body.errors).toBeDefined();
    });

    it('returns an error when amount is negative', async () => {
        const res = await request(app)
            .post('/api/transactions')
            .send({
                wallet_id: primaryWalletId,
                amount: -100,
                type: 'EXPENSE',
                description: 'Negative amount test'
            });

        expect(res.statusCode).toEqual(422);
        expect(res.body.message || JSON.stringify(res.body.errors)).toMatch(/amount phai > 0|greater than/i);
    });

    it('returns an error when amount is zero', async () => {
        const res = await request(app)
            .post('/api/transactions')
            .send({
                wallet_id: primaryWalletId,
                amount: 0,
                type: 'EXPENSE',
                description: 'Zero amount test'
            });

        expect(res.statusCode).toEqual(422);
    });

    it('returns an error when type is invalid', async () => {
        const res = await request(app)
            .post('/api/transactions')
            .send({
                wallet_id: primaryWalletId,
                amount: 50000,
                type: 'INVALID_TYPE',
                description: 'Bad type test'
            });

        expect(res.statusCode).toEqual(422);
        expect(res.body.message || JSON.stringify(res.body.errors)).toMatch(/type khong hop le|Invalid value/i);
    });
});

describe('Transaction API GET /:id', () => {
    it('returns 404 or 500 for a non-existent transaction id', async () => {
        const res = await request(app)
            .get('/api/transactions/00000000-0000-0000-0000-000000000000');

        expect([404, 500]).toContain(res.statusCode);
    });
});

describe('Transaction API create transaction', () => {
    it('creates an expense transaction', async () => {
        const res = await request(app)
            .post('/api/transactions')
            .send({
                wallet_id: primaryWalletId,
                amount: 150000,
                type: 'EXPENSE',
                description: 'Lunch'
            });

        expect(res.statusCode).toEqual(201);
        expect(res.body.data).toHaveProperty('id');
        expect(parseFloat(res.body.data.amount)).toEqual(150000);
    });
});

describe('Transaction API transfer flow', () => {
    it('rejects transfers to the same wallet', async () => {
        const res = await request(app)
            .post('/api/transactions/transfer')
            .send({
                from_wallet_id: primaryWalletId,
                to_wallet_id: primaryWalletId,
                amount: 50000,
                description: 'Invalid transfer'
            });

        expect([400, 422]).toContain(res.statusCode);
    });

    it('creates a paired transfer and returns transfer_group_id', async () => {
        const fromWallet = await mockWallet.create({
            name: 'Transfer Source',
            balance: 600000,
            user_id: 'test-user-id'
        });
        const toWallet = await mockWallet.create({
            name: 'Transfer Destination',
            balance: 100000,
            user_id: 'test-user-id'
        });

        const res = await request(app)
            .post('/api/transactions/transfer')
            .send({
                from_wallet_id: fromWallet.id,
                to_wallet_id: toWallet.id,
                amount: 200000,
                description: 'Savings transfer'
            });

        expect(res.statusCode).toEqual(201);
        expect(res.body.data.transfer_group_id).toBeTruthy();
        expect(res.body.data.transfer_out_id).toBeTruthy();
        expect(res.body.data.transfer_in_id).toBeTruthy();

        const createdTransactions = await mockTransaction.findAll({
            where: { transfer_group_id: res.body.data.transfer_group_id }
        });
        expect(createdTransactions).toHaveLength(2);

        const updatedFromWallet = await mockWallet.findByPk(fromWallet.id);
        const updatedToWallet = await mockWallet.findByPk(toWallet.id);
        expect(Number(updatedFromWallet.balance)).toBe(400000);
        expect(Number(updatedToWallet.balance)).toBe(300000);
    });

    it('deletes both transfer entries and restores both balances', async () => {
        const fromWallet = await mockWallet.create({
            name: 'Delete Source',
            balance: 500000,
            user_id: 'test-user-id'
        });
        const toWallet = await mockWallet.create({
            name: 'Delete Destination',
            balance: 200000,
            user_id: 'test-user-id'
        });

        const createRes = await request(app)
            .post('/api/transactions/transfer')
            .send({
                from_wallet_id: fromWallet.id,
                to_wallet_id: toWallet.id,
                amount: 125000,
                description: 'Delete me'
            });

        expect(createRes.statusCode).toEqual(201);

        const deleteRes = await request(app)
            .delete(`/api/transactions/${createRes.body.data.transfer_out_id}`);

        expect(deleteRes.statusCode).toEqual(200);

        const remainingTransactions = await mockTransaction.findAll({
            where: { transfer_group_id: createRes.body.data.transfer_group_id }
        });
        expect(remainingTransactions).toHaveLength(0);

        const restoredFromWallet = await mockWallet.findByPk(fromWallet.id);
        const restoredToWallet = await mockWallet.findByPk(toWallet.id);
        expect(Number(restoredFromWallet.balance)).toBe(500000);
        expect(Number(restoredToWallet.balance)).toBe(200000);
    });
});
