process.env.JWT_SECRET = 'test-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh';

const request = require('supertest');
const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');

const TEST_USER_ID = '11111111-1111-4111-8111-111111111111';
const SECOND_USER_ID = '22222222-2222-4222-8222-222222222222';

jest.mock('uuid', () => ({
    v4: jest.fn(() => require('crypto').randomUUID())
}));

jest.mock('../middleware/uploadMiddleware', () => ({
    uploadAvatar: { single: () => (req, res, next) => next() }
}));
jest.mock('../middleware/auditMiddleware', () => () => (req, res, next) => next());

jest.mock('../middleware/authMiddleware', () => (req, res, next) => {
    req.user = { id: TEST_USER_ID, role: 'member' };
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
        user_id: TEST_USER_ID
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

    it('creates a family shared expense and persists transaction shares', async () => {
        const familyId = '33333333-3333-4333-8333-333333333333';

        await mockUser.findOrCreate({
            where: { id: TEST_USER_ID },
            defaults: { name: 'Alice', email: 'alice@example.com' }
        });
        await mockUser.findOrCreate({
            where: { id: SECOND_USER_ID },
            defaults: { name: 'Bob', email: 'bob@example.com' }
        });
        await mockFamilyMember.create({
            user_id: TEST_USER_ID,
            family_id: familyId
        });

        const personalWallet = await mockWallet.create({
            name: 'Alice Shared Expense Wallet',
            balance: 500000,
            user_id: TEST_USER_ID
        });

        const res = await request(app)
            .post('/api/transactions')
            .send({
                wallet_id: personalWallet.id,
                family_id: familyId,
                amount: 120000,
                type: 'EXPENSE',
                description: 'Shared dinner',
                shares: [
                    {
                        user_id: TEST_USER_ID,
                        amount: 60000,
                        status: 'PAID',
                        approval_status: 'APPROVED'
                    },
                    {
                        user_id: SECOND_USER_ID,
                        amount: 60000,
                        status: 'UNPAID',
                        approval_status: 'APPROVED'
                    }
                ]
            });

        expect(res.statusCode).toEqual(201);

        const persistedShares = await mockTransactionShare.findAll({
            where: { transaction_id: res.body.data.id },
            order: [['amount', 'ASC']]
        });

        expect(persistedShares).toHaveLength(2);
        expect(persistedShares.map((share) => share.user_id)).toEqual([TEST_USER_ID, SECOND_USER_ID]);
        expect(persistedShares.map((share) => share.status)).toEqual(['PAID', 'UNPAID']);
        expect(persistedShares.map((share) => share.approval_status)).toEqual(['APPROVED', 'APPROVED']);

        const updatedPersonalWallet = await mockWallet.findByPk(personalWallet.id);
        expect(Number(updatedPersonalWallet.balance)).toBe(380000);

        const familyTransactionsRes = await request(app)
            .get('/api/transactions')
            .query({ context: 'family', family_id: familyId });

        expect(familyTransactionsRes.statusCode).toEqual(200);
        expect(familyTransactionsRes.body.data.transactions.some((tx) => tx.id === res.body.data.id)).toBe(true);
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
            user_id: TEST_USER_ID
        });
        const toWallet = await mockWallet.create({
            name: 'Transfer Destination',
            balance: 100000,
            user_id: TEST_USER_ID
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

    it('keeps balances consistent when concurrent transfers target the same source wallet', async () => {
        const fromWallet = await mockWallet.create({
            name: 'Concurrent Source',
            balance: 300000,
            user_id: TEST_USER_ID
        });
        const firstDestination = await mockWallet.create({
            name: 'Concurrent Destination A',
            balance: 100000,
            user_id: TEST_USER_ID
        });
        const secondDestination = await mockWallet.create({
            name: 'Concurrent Destination B',
            balance: 100000,
            user_id: TEST_USER_ID
        });

        const [firstResponse, secondResponse] = await Promise.all([
            request(app)
                .post('/api/transactions/transfer')
                .send({
                    from_wallet_id: fromWallet.id,
                    to_wallet_id: firstDestination.id,
                    amount: 200000,
                    description: 'Concurrent transfer A'
                }),
            request(app)
                .post('/api/transactions/transfer')
                .send({
                    from_wallet_id: fromWallet.id,
                    to_wallet_id: secondDestination.id,
                    amount: 200000,
                    description: 'Concurrent transfer B'
                })
        ]);

        const statusCodes = [firstResponse.statusCode, secondResponse.statusCode]
            .sort((left, right) => left - right);
        expect(statusCodes).toEqual([201, 400]);

        const refreshedSourceWallet = await mockWallet.findByPk(fromWallet.id);
        const refreshedFirstDestination = await mockWallet.findByPk(firstDestination.id);
        const refreshedSecondDestination = await mockWallet.findByPk(secondDestination.id);

        expect(Number(refreshedSourceWallet.balance)).toBe(100000);

        const creditedDestinations = [
            Number(refreshedFirstDestination.balance),
            Number(refreshedSecondDestination.balance)
        ].filter((balance) => balance === 300000);
        const untouchedDestinations = [
            Number(refreshedFirstDestination.balance),
            Number(refreshedSecondDestination.balance)
        ].filter((balance) => balance === 100000);

        expect(creditedDestinations).toHaveLength(1);
        expect(untouchedDestinations).toHaveLength(1);
    });

    it('deletes both transfer entries and restores both balances', async () => {
        const fromWallet = await mockWallet.create({
            name: 'Delete Source',
            balance: 500000,
            user_id: TEST_USER_ID
        });
        const toWallet = await mockWallet.create({
            name: 'Delete Destination',
            balance: 200000,
            user_id: TEST_USER_ID
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
