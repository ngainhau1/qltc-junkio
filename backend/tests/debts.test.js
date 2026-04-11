const request = require('supertest');
const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');

// Setup mock DB & model
const mockSequelize = new Sequelize('sqlite::memory:', { logging: false });

const mockUser = mockSequelize.define('User', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING },
    avatar: { type: DataTypes.STRING }
});

const mockWallet = mockSequelize.define('Wallet', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING },
    family_id: { type: DataTypes.UUID },
    balance: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 }
});

const mockTransaction = mockSequelize.define('Transaction', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    user_id: { type: DataTypes.UUID },
    wallet_id: { type: DataTypes.UUID },
    amount: { type: DataTypes.DECIMAL(15, 2) },
    type: { type: DataTypes.STRING },
    description: { type: DataTypes.STRING }
});

const mockTransactionShare = mockSequelize.define('TransactionShare', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    transaction_id: { type: DataTypes.UUID },
    user_id: { type: DataTypes.UUID },
    amount: { type: DataTypes.DECIMAL(15, 2) },
    status: { type: DataTypes.STRING, defaultValue: 'UNPAID' },
    approval_status: { type: DataTypes.STRING, defaultValue: 'PENDING' }
});

const mockNotification = mockSequelize.define('Notification', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    user_id: { type: DataTypes.UUID },
    type: { type: DataTypes.STRING },
    title: { type: DataTypes.STRING },
    message: { type: DataTypes.STRING }
});

// Relationships
mockTransactionShare.belongsTo(mockTransaction, { as: 'Transaction', foreignKey: 'transaction_id' });
mockTransaction.hasMany(mockTransactionShare, { as: 'Shares', foreignKey: 'transaction_id' });

mockTransaction.belongsTo(mockUser, { foreignKey: 'user_id' });
mockTransaction.belongsTo(mockWallet, { foreignKey: 'wallet_id' });

jest.mock('../models/index', () => ({
    sequelize: mockSequelize, // Also mocking the literal sequelize instance
    User: mockUser,
    Wallet: mockWallet,
    Transaction: mockTransaction,
    TransactionShare: mockTransactionShare,
    Notification: mockNotification
}));

jest.mock('../models', () => ({
    sequelize: mockSequelize,
    User: mockUser,
    Wallet: mockWallet,
    Transaction: mockTransaction,
    TransactionShare: mockTransactionShare,
    Notification: mockNotification
}));

// Mock socket
jest.mock('../config/socket', () => ({
    getIO: () => ({
        to: () => ({
            emit: jest.fn()
        })
    })
}));

let mockUserId; 
jest.mock('../middleware/authMiddleware', () => (req, res, next) => {
    req.user = { id: mockUserId, role: 'USER' };
    next();
});

const debtRoutes = require('../routes/debtRoutes');

const app = express();
app.use(express.json());
app.use('/api/debts', debtRoutes);

describe('Debt API Endpoints', () => {
    let creditorId, debtorId, familyId, walletCreditorId, walletDebtorId, pendingShareId, txId;

    beforeAll(async () => {
        await mockSequelize.sync({ force: true });
        const crypto = require('crypto');

        creditorId = crypto.randomUUID();
        debtorId = crypto.randomUUID();
        familyId = crypto.randomUUID();

        await mockUser.create({ id: creditorId, name: 'Creditor' });
        await mockUser.create({ id: debtorId, name: 'Debtor' });

        const wC = await mockWallet.create({ name: 'W_C', family_id: familyId, balance: 10000 });
        walletCreditorId = wC.id;

        const wD = await mockWallet.create({ name: 'W_D', family_id: familyId, balance: 5000 });
        walletDebtorId = wD.id;

        const unrelatedWallet = await mockWallet.create({ name: 'W_OTHER', family_id: crypto.randomUUID(), balance: 2000 });

        // Transaction driven by creditor
        const tx = await mockTransaction.create({
            user_id: creditorId,
            wallet_id: walletCreditorId,
            amount: 2000, // Debtor owes 2000 to creditor
            type: 'EXPENSE',
            description: 'Lunch'
        });
        txId = tx.id;

        // Debtor owes 1000, pending
        const share1 = await mockTransactionShare.create({
            transaction_id: tx.id,
            user_id: debtorId,
            amount: 1000,
            status: 'UNPAID',
            approval_status: 'PENDING'
        });
        pendingShareId = share1.id;

        // Debtor owes 500, approved
        await mockTransactionShare.create({
            transaction_id: tx.id,
            user_id: debtorId,
            amount: 500,
            status: 'UNPAID',
            approval_status: 'APPROVED'
        });

        const unrelatedTx = await mockTransaction.create({
            user_id: creditorId,
            wallet_id: unrelatedWallet.id,
            amount: 900,
            type: 'EXPENSE',
            description: 'Outside family scope'
        });

        await mockTransactionShare.create({
            transaction_id: unrelatedTx.id,
            user_id: debtorId,
            amount: 900,
            status: 'UNPAID',
            approval_status: 'APPROVED'
        });
    });

    afterAll(async () => {
        await mockSequelize.close();
    });

    describe('GET /api/debts/pending', () => {
        it('should get pending debts for the debtor', async () => {
            mockUserId = debtorId;
            const res = await request(app).get('/api/debts/pending');
            expect(res.statusCode).toEqual(200);
            expect(res.body.data.length).toBe(1);
            expect(res.body.data[0].id).toBe(pendingShareId);
        });
    });

    describe('PUT /api/debts/:shareId/approve & reject', () => {
        it('should return 403 if approving someone else debt', async () => {
            mockUserId = creditorId; // Creditor tries to approve debtor's debt
            const res = await request(app).put(`/api/debts/${pendingShareId}/approve`);
            expect(res.statusCode).toEqual(403);
            expect(res.body.message).toMatch(/Không có quyền duyệt/);
        });

        it('should approve share successfully', async () => {
            mockUserId = debtorId;
            const res = await request(app).put(`/api/debts/${pendingShareId}/approve`);
            expect(res.statusCode).toEqual(200);
            expect(res.body.data.approval_status).toBe('APPROVED');
        });

        it('should reject share successfully', async () => {
            mockUserId = debtorId;
            const tempShare = await mockTransactionShare.create({
                transaction_id: txId, // valid tx id
                user_id: debtorId,
                amount: 100,
                status: 'UNPAID',
                approval_status: 'PENDING'
            });

            const res = await request(app).put(`/api/debts/${tempShare.id}/reject`);
            expect(res.statusCode).toEqual(200);
            expect(res.body.data.approval_status).toBe('REJECTED');
        });
    });

    describe('GET /api/debts/simplified/:familyId', () => {
        it('should return simplified debts for the family', async () => {
            mockUserId = creditorId; // Doesn't matter, no auth check in controller currently for identity
            
            // Right now, debtor owes creditor (1000 + 500 = 1500) both APPROVED
            const res = await request(app).get(`/api/debts/simplified/${familyId}`);
            
            expect(res.statusCode).toEqual(200);
            expect(res.body.data.originalTransactions).toBe(2);
            expect(res.body.data.simplifiedTransactions).toBe(1);
            expect(res.body.data.suggestions[0].from.id).toBe(debtorId);
            expect(res.body.data.suggestions[0].to.id).toBe(creditorId);
            expect(res.body.data.suggestions[0].amount).toBe(1500); // 1000+500
        });
    });

    describe('POST /api/debts/settle', () => {
        it('should settle partial debt and deduct from wallet', async () => {
            mockUserId = debtorId; // Debtor is paying
            const res = await request(app).post('/api/debts/settle').send({
                to_user_id: creditorId,
                amount: 600, // partial of 1500
                from_wallet_id: walletDebtorId,
                to_wallet_id: walletCreditorId
            });

            expect(res.statusCode).toEqual(200);
            expect(res.body.message).toMatch(/Thanh toán bù trừ thành công/);

            // Verify wallet balances updated
            const vDebtor = await mockWallet.findByPk(walletDebtorId);
            const vCreditor = await mockWallet.findByPk(walletCreditorId);
            expect(Number(vDebtor.balance)).toBe(5000 - 600);
            expect(Number(vCreditor.balance)).toBe(10000 + 600);

            // Verify shares
            // share1 was 1000, now should be 400 (if it iterated first)
            const share1 = await mockTransactionShare.findByPk(pendingShareId);
            expect(Number(share1.amount)).toBe(400); 

            // Verify transactions generated
            const rx = await mockTransaction.findAll();
            expect(rx.length).toBeGreaterThan(1); // 1 original + 2 transfers
        });
    });
});
