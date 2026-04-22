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

const mockFamily = mockSequelize.define('Family', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING },
    owner_id: { type: DataTypes.UUID }
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
    Family: mockFamily,
    Wallet: mockWallet,
    Transaction: mockTransaction,
    TransactionShare: mockTransactionShare,
    Notification: mockNotification
}));

jest.mock('../models', () => ({
    sequelize: mockSequelize,
    User: mockUser,
    Family: mockFamily,
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
        await mockFamily.create({ id: familyId, name: 'Main Family', owner_id: creditorId });

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

        it('reduces chained debts to the minimum settlement set', async () => {
            mockUserId = creditorId;

            const crypto = require('crypto');
            const chainedFamilyId = crypto.randomUUID();
            const debtorAId = crypto.randomUUID();
            const debtorBId = crypto.randomUUID();
            const creditorCId = crypto.randomUUID();

            await mockUser.bulkCreate([
                { id: debtorAId, name: 'Debtor A' },
                { id: debtorBId, name: 'Debtor B' },
                { id: creditorCId, name: 'Creditor C' }
            ]);

            const walletB = await mockWallet.create({
                name: 'Wallet B',
                family_id: chainedFamilyId,
                balance: 5000
            });
            const walletC = await mockWallet.create({
                name: 'Wallet C',
                family_id: chainedFamilyId,
                balance: 5000
            });

            const transactionB = await mockTransaction.create({
                user_id: debtorBId,
                wallet_id: walletB.id,
                amount: 500,
                type: 'EXPENSE',
                description: 'B paid for A'
            });
            const transactionC = await mockTransaction.create({
                user_id: creditorCId,
                wallet_id: walletC.id,
                amount: 500,
                type: 'EXPENSE',
                description: 'C paid for B'
            });

            await mockTransactionShare.bulkCreate([
                {
                    transaction_id: transactionB.id,
                    user_id: debtorAId,
                    amount: 500,
                    status: 'UNPAID',
                    approval_status: 'APPROVED'
                },
                {
                    transaction_id: transactionC.id,
                    user_id: debtorBId,
                    amount: 500,
                    status: 'UNPAID',
                    approval_status: 'APPROVED'
                }
            ]);

            const res = await request(app).get(`/api/debts/simplified/${chainedFamilyId}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.data.originalTransactions).toBe(2);
            expect(res.body.data.simplifiedTransactions).toBe(1);
            expect(res.body.data.suggestions[0].from.id).toBe(debtorAId);
            expect(res.body.data.suggestions[0].to.id).toBe(creditorCId);
            expect(res.body.data.suggestions[0].amount).toBe(500);
        });

        it('includes legacy pending shares unless they were rejected', async () => {
            const crypto = require('crypto');
            const legacyFamilyId = crypto.randomUUID();
            const legacyCreditorId = crypto.randomUUID();
            const legacyDebtorId = crypto.randomUUID();

            await mockUser.bulkCreate([
                { id: legacyCreditorId, name: 'Legacy Creditor' },
                { id: legacyDebtorId, name: 'Legacy Debtor' }
            ]);

            const legacyWallet = await mockWallet.create({
                name: 'Legacy Wallet',
                family_id: legacyFamilyId,
                balance: 1000
            });
            const legacyTx = await mockTransaction.create({
                user_id: legacyCreditorId,
                wallet_id: legacyWallet.id,
                amount: 200,
                type: 'EXPENSE',
                description: 'Legacy pending dinner'
            });

            await mockTransactionShare.create({
                transaction_id: legacyTx.id,
                user_id: legacyDebtorId,
                amount: 200,
                status: 'UNPAID',
                approval_status: 'PENDING'
            });

            const res = await request(app).get(`/api/debts/simplified/${legacyFamilyId}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.data.originalTransactions).toBe(1);
            expect(res.body.data.suggestions[0].from.id).toBe(legacyDebtorId);
            expect(res.body.data.suggestions[0].to.id).toBe(legacyCreditorId);
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
            expect(res.body.message).toBe('DEBT_SETTLED');

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

        it('should settle full direct debt once and reject duplicate settlement', async () => {
            const crypto = require('crypto');
            const directFamilyId = crypto.randomUUID();
            const directCreditorId = crypto.randomUUID();
            const directDebtorId = crypto.randomUUID();

            await mockUser.bulkCreate([
                { id: directCreditorId, name: 'Direct Creditor' },
                { id: directDebtorId, name: 'Direct Debtor' }
            ]);

            const directCreditorWallet = await mockWallet.create({
                name: 'Direct Creditor Wallet',
                family_id: directFamilyId,
                balance: 1000
            });
            const directDebtorWallet = await mockWallet.create({
                name: 'Direct Debtor Wallet',
                family_id: directFamilyId,
                balance: 1000
            });
            const directTx = await mockTransaction.create({
                user_id: directCreditorId,
                wallet_id: directCreditorWallet.id,
                amount: 300,
                type: 'EXPENSE',
                description: 'Direct dinner'
            });
            const directShare = await mockTransactionShare.create({
                transaction_id: directTx.id,
                user_id: directDebtorId,
                amount: 300,
                status: 'UNPAID',
                approval_status: 'APPROVED'
            });

            mockUserId = directDebtorId;
            const firstRes = await request(app).post('/api/debts/settle').send({
                to_user_id: directCreditorId,
                amount: 300,
                from_wallet_id: directDebtorWallet.id,
                to_wallet_id: directCreditorWallet.id
            });

            expect(firstRes.statusCode).toEqual(200);
            const settledShare = await mockTransactionShare.findByPk(directShare.id);
            expect(settledShare.status).toBe('PAID');

            const transactionCountAfterFirstSettle = await mockTransaction.count();
            const secondRes = await request(app).post('/api/debts/settle').send({
                to_user_id: directCreditorId,
                amount: 300,
                from_wallet_id: directDebtorWallet.id,
                to_wallet_id: directCreditorWallet.id
            });

            expect(secondRes.statusCode).toEqual(409);
            expect(secondRes.body.message).toBe('NO_PAYABLE_DEBT_FOUND');
            expect(await mockTransaction.count()).toBe(transactionCountAfterFirstSettle);
        });

        it('should let family owner record a member reimbursement into the family fund', async () => {
            const crypto = require('crypto');
            const fundFamilyId = crypto.randomUUID();
            const familyOwnerId = crypto.randomUUID();
            const familyDebtorId = crypto.randomUUID();

            await mockUser.bulkCreate([
                { id: familyOwnerId, name: 'Fund Owner' },
                { id: familyDebtorId, name: 'Fund Debtor' }
            ]);
            await mockFamily.create({ id: fundFamilyId, name: 'Fund Family', owner_id: familyOwnerId });

            const familyWallet = await mockWallet.create({
                name: 'Family Fund Wallet',
                family_id: fundFamilyId,
                balance: 1000
            });

            const sharedExpense = await mockTransaction.create({
                user_id: familyOwnerId,
                wallet_id: familyWallet.id,
                amount: 500,
                type: 'EXPENSE',
                description: 'Family groceries'
            });

            const debtorShare = await mockTransactionShare.create({
                transaction_id: sharedExpense.id,
                user_id: familyDebtorId,
                amount: 500,
                status: 'UNPAID',
                approval_status: 'APPROVED'
            });

            mockUserId = familyOwnerId;
            const transactionCountBefore = await mockTransaction.count();
            const res = await request(app).post('/api/debts/settle').send({
                from_user_id: familyDebtorId,
                amount: 500,
                from_wallet_id: familyWallet.id,
                to_wallet_id: familyWallet.id,
                family_id: fundFamilyId
            });

            expect(res.statusCode).toEqual(200);

            const settledShare = await mockTransactionShare.findByPk(debtorShare.id);
            expect(settledShare.status).toBe('PAID');

            const updatedFamilyWallet = await mockWallet.findByPk(familyWallet.id);
            expect(Number(updatedFamilyWallet.balance)).toBe(1500);

            const createdTransactions = await mockTransaction.findAll({
                where: { wallet_id: familyWallet.id }
            });
            expect(await mockTransaction.count()).toBe(transactionCountBefore + 1);
            expect(createdTransactions.some((tx) => tx.type === 'INCOME')).toBe(true);
            expect(createdTransactions.some((tx) => tx.type === 'TRANSFER_OUT')).toBe(false);
            expect(createdTransactions.some((tx) => tx.type === 'TRANSFER_IN')).toBe(false);
        });

        it('should reject duplicate family fund reimbursement without creating another transaction', async () => {
            const crypto = require('crypto');
            const duplicateFamilyId = crypto.randomUUID();
            const duplicateOwnerId = crypto.randomUUID();
            const duplicateDebtorId = crypto.randomUUID();

            await mockUser.bulkCreate([
                { id: duplicateOwnerId, name: 'Duplicate Owner' },
                { id: duplicateDebtorId, name: 'Duplicate Debtor' }
            ]);
            await mockFamily.create({ id: duplicateFamilyId, name: 'Duplicate Family', owner_id: duplicateOwnerId });

            const familyWallet = await mockWallet.create({
                name: 'Duplicate Family Fund',
                family_id: duplicateFamilyId,
                balance: 1000
            });
            const sharedExpense = await mockTransaction.create({
                user_id: duplicateOwnerId,
                wallet_id: familyWallet.id,
                amount: 300,
                type: 'EXPENSE',
                description: 'Duplicate dinner'
            });
            await mockTransactionShare.create({
                transaction_id: sharedExpense.id,
                user_id: duplicateDebtorId,
                amount: 300,
                status: 'UNPAID',
                approval_status: 'APPROVED'
            });

            mockUserId = duplicateOwnerId;
            const payload = {
                from_user_id: duplicateDebtorId,
                amount: 300,
                from_wallet_id: familyWallet.id,
                to_wallet_id: familyWallet.id,
                family_id: duplicateFamilyId
            };

            const firstRes = await request(app).post('/api/debts/settle').send(payload);
            expect(firstRes.statusCode).toEqual(200);

            const transactionCountAfterFirstSettle = await mockTransaction.count();
            const walletAfterFirstSettle = await mockWallet.findByPk(familyWallet.id);

            const secondRes = await request(app).post('/api/debts/settle').send(payload);

            expect(secondRes.statusCode).toEqual(409);
            expect(secondRes.body.message).toBe('NO_PAYABLE_DEBT_FOUND');
            expect(await mockTransaction.count()).toBe(transactionCountAfterFirstSettle);

            const walletAfterDuplicate = await mockWallet.findByPk(familyWallet.id);
            expect(Number(walletAfterDuplicate.balance)).toBe(Number(walletAfterFirstSettle.balance));
        });

        it('should reject family fund reimbursement amounts greater than open debt', async () => {
            const crypto = require('crypto');
            const exceedFamilyId = crypto.randomUUID();
            const exceedOwnerId = crypto.randomUUID();
            const exceedDebtorId = crypto.randomUUID();

            await mockUser.bulkCreate([
                { id: exceedOwnerId, name: 'Exceed Owner' },
                { id: exceedDebtorId, name: 'Exceed Debtor' }
            ]);
            await mockFamily.create({ id: exceedFamilyId, name: 'Exceed Family', owner_id: exceedOwnerId });

            const familyWallet = await mockWallet.create({
                name: 'Exceed Family Fund',
                family_id: exceedFamilyId,
                balance: 1000
            });
            const sharedExpense = await mockTransaction.create({
                user_id: exceedOwnerId,
                wallet_id: familyWallet.id,
                amount: 200,
                type: 'EXPENSE',
                description: 'Exceed dinner'
            });
            await mockTransactionShare.create({
                transaction_id: sharedExpense.id,
                user_id: exceedDebtorId,
                amount: 200,
                status: 'UNPAID',
                approval_status: 'APPROVED'
            });

            mockUserId = exceedOwnerId;
            const transactionCountBefore = await mockTransaction.count();
            const res = await request(app).post('/api/debts/settle').send({
                from_user_id: exceedDebtorId,
                amount: 201,
                from_wallet_id: familyWallet.id,
                to_wallet_id: familyWallet.id,
                family_id: exceedFamilyId
            });

            expect(res.statusCode).toEqual(400);
            expect(res.body.message).toBe('SETTLEMENT_AMOUNT_EXCEEDS_DEBT');
            expect(await mockTransaction.count()).toBe(transactionCountBefore);
        });

        it('should reduce family shares on partial reimbursements without marking them paid too early', async () => {
            const crypto = require('crypto');
            const partialFamilyId = crypto.randomUUID();
            const partialOwnerId = crypto.randomUUID();
            const partialDebtorId = crypto.randomUUID();

            await mockUser.bulkCreate([
                { id: partialOwnerId, name: 'Partial Owner' },
                { id: partialDebtorId, name: 'Partial Debtor' }
            ]);
            await mockFamily.create({ id: partialFamilyId, name: 'Partial Family', owner_id: partialOwnerId });

            const familyWallet = await mockWallet.create({
                name: 'Partial Family Fund',
                family_id: partialFamilyId,
                balance: 1000
            });
            const sharedExpense = await mockTransaction.create({
                user_id: partialOwnerId,
                wallet_id: familyWallet.id,
                amount: 400,
                type: 'EXPENSE',
                description: 'Partial dinner'
            });
            const debtorShare = await mockTransactionShare.create({
                transaction_id: sharedExpense.id,
                user_id: partialDebtorId,
                amount: 400,
                status: 'UNPAID',
                approval_status: 'APPROVED'
            });

            mockUserId = partialOwnerId;
            const res = await request(app).post('/api/debts/settle').send({
                from_user_id: partialDebtorId,
                amount: 150,
                from_wallet_id: familyWallet.id,
                to_wallet_id: familyWallet.id,
                family_id: partialFamilyId
            });

            expect(res.statusCode).toEqual(200);

            const partiallySettledShare = await mockTransactionShare.findByPk(debtorShare.id);
            expect(partiallySettledShare.status).toBe('UNPAID');
            expect(Number(partiallySettledShare.amount)).toBe(250);

            const updatedFamilyWallet = await mockWallet.findByPk(familyWallet.id);
            expect(Number(updatedFamilyWallet.balance)).toBe(1150);
        });

        it('should reject family fund reimbursement from non-owner users', async () => {
            const crypto = require('crypto');
            const ownerId = crypto.randomUUID();
            const nonOwnerId = crypto.randomUUID();
            const familyDebtorId = crypto.randomUUID();
            const familyCreditorId = crypto.randomUUID();
            const protectedFamilyId = crypto.randomUUID();

            await mockUser.bulkCreate([
                { id: ownerId, name: 'Protected Owner' },
                { id: nonOwnerId, name: 'Protected Member' },
                { id: familyDebtorId, name: 'Protected Debtor' },
                { id: familyCreditorId, name: 'Protected Creditor' }
            ]);
            await mockFamily.create({
                id: protectedFamilyId,
                name: 'Protected Family',
                owner_id: ownerId
            });

            const protectedWallet = await mockWallet.create({
                name: 'Protected Wallet',
                family_id: protectedFamilyId,
                balance: 1000
            });
            const protectedTx = await mockTransaction.create({
                user_id: familyCreditorId,
                wallet_id: protectedWallet.id,
                amount: 250,
                type: 'EXPENSE',
                description: 'Protected dinner'
            });
            await mockTransactionShare.create({
                transaction_id: protectedTx.id,
                user_id: familyDebtorId,
                amount: 250,
                status: 'UNPAID',
                approval_status: 'APPROVED'
            });

            const transactionCountBefore = await mockTransaction.count();
            mockUserId = nonOwnerId;
            const res = await request(app).post('/api/debts/settle').send({
                from_user_id: familyDebtorId,
                amount: 250,
                from_wallet_id: protectedWallet.id,
                to_wallet_id: protectedWallet.id,
                family_id: protectedFamilyId
            });

            expect(res.statusCode).toEqual(403);
            expect(res.body.message).toBe('FORBIDDEN_FAMILY_SETTLEMENT');
            expect(await mockTransaction.count()).toBe(transactionCountBefore);
        });
    });
});
