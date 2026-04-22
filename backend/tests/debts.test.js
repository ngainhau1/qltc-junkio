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
    user_id: { type: DataTypes.UUID },
    family_id: { type: DataTypes.UUID },
    balance: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 }
});

const mockFamily = mockSequelize.define('Family', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING },
    owner_id: { type: DataTypes.UUID }
});

const mockFamilyMember = mockSequelize.define('FamilyMember', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    family_id: { type: DataTypes.UUID },
    user_id: { type: DataTypes.UUID }
});

const mockTransaction = mockSequelize.define('Transaction', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    user_id: { type: DataTypes.UUID },
    wallet_id: { type: DataTypes.UUID },
    family_id: { type: DataTypes.UUID },
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
    approval_status: { type: DataTypes.STRING, defaultValue: 'APPROVED' }
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
    FamilyMember: mockFamilyMember,
    Wallet: mockWallet,
    Transaction: mockTransaction,
    TransactionShare: mockTransactionShare,
    Notification: mockNotification
}));

jest.mock('../models', () => ({
    sequelize: mockSequelize,
    User: mockUser,
    Family: mockFamily,
    FamilyMember: mockFamilyMember,
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
    let creditorId, debtorId, familyId, walletCreditorId, walletDebtorId, primaryShareId;

    beforeAll(async () => {
        await mockSequelize.sync({ force: true });
        const crypto = require('crypto');

        creditorId = crypto.randomUUID();
        debtorId = crypto.randomUUID();
        familyId = crypto.randomUUID();

        await mockUser.create({ id: creditorId, name: 'Creditor' });
        await mockUser.create({ id: debtorId, name: 'Debtor' });
        await mockFamily.create({ id: familyId, name: 'Main Family', owner_id: creditorId });
        await mockFamilyMember.bulkCreate([
            { family_id: familyId, user_id: creditorId },
            { family_id: familyId, user_id: debtorId }
        ]);

        const wC = await mockWallet.create({ name: 'W_C', user_id: creditorId, balance: 10000 });
        walletCreditorId = wC.id;

        const wD = await mockWallet.create({ name: 'W_D', user_id: debtorId, balance: 5000 });
        walletDebtorId = wD.id;

        const unrelatedWallet = await mockWallet.create({ name: 'W_OTHER', user_id: creditorId, balance: 2000 });

        // Transaction driven by creditor
        const tx = await mockTransaction.create({
            user_id: creditorId,
            wallet_id: walletCreditorId,
            amount: 2000, // Debtor owes 2000 to creditor
            type: 'EXPENSE',
            description: 'Lunch',
            family_id: familyId
        });
        // Debtor owes 1000
        const share1 = await mockTransactionShare.create({
            transaction_id: tx.id,
            user_id: debtorId,
            amount: 1000,
            status: 'UNPAID',
            approval_status: 'APPROVED'
        });
        primaryShareId = share1.id;

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
            description: 'Outside family scope',
            family_id: crypto.randomUUID()
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

    describe('GET /api/debts/simplified/:familyId', () => {
        it('should return simplified debts for the family', async () => {
            mockUserId = creditorId;
            
            const res = await request(app).get(`/api/debts/simplified/${familyId}`);
            
            expect(res.statusCode).toEqual(200);
            expect(res.body.data.originalTransactions).toBe(2);
            expect(res.body.data.simplifiedTransactions).toBe(1);
            expect(res.body.data.suggestions[0].from.id).toBe(debtorId);
            expect(res.body.data.suggestions[0].to.id).toBe(creditorId);
            expect(res.body.data.suggestions[0].amount).toBe(1500); // 1000+500
        });

        it('rejects simplified debt lookup for non-members', async () => {
            const outsiderId = crypto.randomUUID();
            await mockUser.create({ id: outsiderId, name: 'Outsider' });
            mockUserId = outsiderId;

            const res = await request(app).get(`/api/debts/simplified/${familyId}`);

            expect(res.statusCode).toEqual(403);
            expect(res.body.message).toBe('FORBIDDEN_FAMILY_SETTLEMENT');
        });

        it('reduces chained debts to the minimum settlement set', async () => {
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
            await mockFamily.create({ id: chainedFamilyId, name: 'Chained Family', owner_id: creditorCId });
            await mockFamilyMember.bulkCreate([
                { family_id: chainedFamilyId, user_id: debtorAId },
                { family_id: chainedFamilyId, user_id: debtorBId },
                { family_id: chainedFamilyId, user_id: creditorCId }
            ]);
            mockUserId = creditorCId;

            const walletB = await mockWallet.create({
                name: 'Wallet B',
                user_id: debtorBId,
                balance: 5000
            });
            const walletC = await mockWallet.create({
                name: 'Wallet C',
                user_id: creditorCId,
                balance: 5000
            });

            const transactionB = await mockTransaction.create({
                user_id: debtorBId,
                wallet_id: walletB.id,
                amount: 500,
                type: 'EXPENSE',
                description: 'B paid for A',
                family_id: chainedFamilyId
            });
            const transactionC = await mockTransaction.create({
                user_id: creditorCId,
                wallet_id: walletC.id,
                amount: 500,
                type: 'EXPENSE',
                description: 'C paid for B',
                family_id: chainedFamilyId
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

        it('does not include unapproved shares in settlement suggestions', async () => {
            const crypto = require('crypto');
            const unapprovedFamilyId = crypto.randomUUID();
            const unapprovedCreditorId = crypto.randomUUID();
            const unapprovedDebtorId = crypto.randomUUID();

            await mockUser.bulkCreate([
                { id: unapprovedCreditorId, name: 'Unapproved Creditor' },
                { id: unapprovedDebtorId, name: 'Unapproved Debtor' }
            ]);
            await mockFamily.create({ id: unapprovedFamilyId, name: 'Unapproved Family', owner_id: unapprovedCreditorId });
            await mockFamilyMember.bulkCreate([
                { family_id: unapprovedFamilyId, user_id: unapprovedCreditorId },
                { family_id: unapprovedFamilyId, user_id: unapprovedDebtorId }
            ]);
            mockUserId = unapprovedCreditorId;

            const unapprovedWallet = await mockWallet.create({
                name: 'Unapproved Wallet',
                user_id: unapprovedCreditorId,
                balance: 1000
            });
            const unapprovedTx = await mockTransaction.create({
                user_id: unapprovedCreditorId,
                wallet_id: unapprovedWallet.id,
                amount: 200,
                type: 'EXPENSE',
                description: 'Unapproved dinner',
                family_id: unapprovedFamilyId
            });

            await mockTransactionShare.create({
                transaction_id: unapprovedTx.id,
                user_id: unapprovedDebtorId,
                amount: 200,
                status: 'UNPAID',
                approval_status: 'REJECTED'
            });

            const res = await request(app).get(`/api/debts/simplified/${unapprovedFamilyId}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.data.originalTransactions).toBe(0);
            expect(res.body.data.simplifiedTransactions).toBe(0);
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
            const share1 = await mockTransactionShare.findByPk(primaryShareId);
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
                user_id: directCreditorId,
                balance: 1000
            });
            const directDebtorWallet = await mockWallet.create({
                name: 'Direct Debtor Wallet',
                user_id: directDebtorId,
                balance: 1000
            });
            const directTx = await mockTransaction.create({
                user_id: directCreditorId,
                wallet_id: directCreditorWallet.id,
                amount: 300,
                type: 'EXPENSE',
                description: 'Direct dinner',
                family_id: directFamilyId
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

        it('should let a member settle their own family debt to the original payer wallet', async () => {
            const crypto = require('crypto');
            const memberFamilyId = crypto.randomUUID();
            const payerId = crypto.randomUUID();
            const memberDebtorId = crypto.randomUUID();

            await mockUser.bulkCreate([
                { id: payerId, name: 'Original Payer' },
                { id: memberDebtorId, name: 'Member Debtor' }
            ]);
            await mockFamily.create({ id: memberFamilyId, name: 'Member Family', owner_id: payerId });
            await mockFamilyMember.bulkCreate([
                { family_id: memberFamilyId, user_id: payerId },
                { family_id: memberFamilyId, user_id: memberDebtorId }
            ]);

            const payerWallet = await mockWallet.create({
                name: 'Payer Personal Wallet',
                user_id: payerId,
                balance: 1000
            });
            const debtorWallet = await mockWallet.create({
                name: 'Debtor Personal Wallet',
                user_id: memberDebtorId,
                balance: 800
            });

            const sharedExpense = await mockTransaction.create({
                user_id: payerId,
                wallet_id: payerWallet.id,
                family_id: memberFamilyId,
                amount: 500,
                type: 'EXPENSE',
                description: 'Family groceries'
            });

            const debtorShare = await mockTransactionShare.create({
                transaction_id: sharedExpense.id,
                user_id: memberDebtorId,
                amount: 500,
                status: 'UNPAID',
                approval_status: 'APPROVED'
            });

            mockUserId = memberDebtorId;
            const transactionCountBefore = await mockTransaction.count();
            const res = await request(app).post('/api/debts/settle').send({
                to_user_id: payerId,
                amount: 500,
                from_wallet_id: debtorWallet.id,
                to_wallet_id: payerWallet.id,
                family_id: memberFamilyId
            });

            expect(res.statusCode).toEqual(200);

            const settledShare = await mockTransactionShare.findByPk(debtorShare.id);
            expect(settledShare.status).toBe('PAID');

            const updatedDebtorWallet = await mockWallet.findByPk(debtorWallet.id);
            const updatedPayerWallet = await mockWallet.findByPk(payerWallet.id);
            expect(Number(updatedDebtorWallet.balance)).toBe(300);
            expect(Number(updatedPayerWallet.balance)).toBe(1500);
            expect(await mockTransaction.count()).toBe(transactionCountBefore + 2);

            const createdTransactions = await mockTransaction.findAll({
                where: { family_id: memberFamilyId }
            });
            const transferOut = createdTransactions.find((tx) => tx.type === 'TRANSFER_OUT');
            const transferIn = createdTransactions.find((tx) => tx.type === 'TRANSFER_IN');
            expect(transferOut).toBeTruthy();
            expect(transferIn).toBeTruthy();
            expect(transferOut.description).toBe('Trả nợ cho Original Payer');
            expect(transferIn.description).toBe('Nhận tiền trả nợ từ Member Debtor');
            expect(createdTransactions.some((tx) => tx.type === 'INCOME')).toBe(false);
        });

        it('should infer recipient wallets from open family shares when to_wallet_id is omitted', async () => {
            const crypto = require('crypto');
            const inferredFamilyId = crypto.randomUUID();
            const inferredPayerId = crypto.randomUUID();
            const inferredDebtorId = crypto.randomUUID();

            await mockUser.bulkCreate([
                { id: inferredPayerId, name: 'Inferred Payer' },
                { id: inferredDebtorId, name: 'Inferred Debtor' }
            ]);
            await mockFamily.create({ id: inferredFamilyId, name: 'Inferred Family', owner_id: inferredPayerId });
            await mockFamilyMember.bulkCreate([
                { family_id: inferredFamilyId, user_id: inferredPayerId },
                { family_id: inferredFamilyId, user_id: inferredDebtorId }
            ]);

            const payerWalletA = await mockWallet.create({
                name: 'Inferred Wallet A',
                user_id: inferredPayerId,
                balance: 1000
            });
            const payerWalletB = await mockWallet.create({
                name: 'Inferred Wallet B',
                user_id: inferredPayerId,
                balance: 2000
            });
            const debtorWallet = await mockWallet.create({
                name: 'Inferred Debtor Wallet',
                user_id: inferredDebtorId,
                balance: 1000
            });

            const expenseA = await mockTransaction.create({
                user_id: inferredPayerId,
                wallet_id: payerWalletA.id,
                family_id: inferredFamilyId,
                amount: 100,
                type: 'EXPENSE',
                description: 'Expense A'
            });
            const expenseB = await mockTransaction.create({
                user_id: inferredPayerId,
                wallet_id: payerWalletB.id,
                family_id: inferredFamilyId,
                amount: 200,
                type: 'EXPENSE',
                description: 'Expense B'
            });

            const shareA = await mockTransactionShare.create({
                transaction_id: expenseA.id,
                user_id: inferredDebtorId,
                amount: 100,
                status: 'UNPAID',
                approval_status: 'APPROVED'
            });
            const shareB = await mockTransactionShare.create({
                transaction_id: expenseB.id,
                user_id: inferredDebtorId,
                amount: 200,
                status: 'UNPAID',
                approval_status: 'APPROVED'
            });

            mockUserId = inferredDebtorId;
            const transactionCountBefore = await mockTransaction.count();
            const res = await request(app).post('/api/debts/settle').send({
                to_user_id: inferredPayerId,
                amount: 300,
                from_wallet_id: debtorWallet.id,
                family_id: inferredFamilyId
            });

            expect(res.statusCode).toEqual(200);

            const updatedDebtorWallet = await mockWallet.findByPk(debtorWallet.id);
            const updatedPayerWalletA = await mockWallet.findByPk(payerWalletA.id);
            const updatedPayerWalletB = await mockWallet.findByPk(payerWalletB.id);
            expect(Number(updatedDebtorWallet.balance)).toBe(700);
            expect(Number(updatedPayerWalletA.balance)).toBe(1100);
            expect(Number(updatedPayerWalletB.balance)).toBe(2200);

            const updatedShareA = await mockTransactionShare.findByPk(shareA.id);
            const updatedShareB = await mockTransactionShare.findByPk(shareB.id);
            expect(updatedShareA.status).toBe('PAID');
            expect(updatedShareB.status).toBe('PAID');

            const createdTransactions = await mockTransaction.findAll({
                where: { family_id: inferredFamilyId }
            });
            const transferOutTransactions = createdTransactions.filter((tx) => tx.type === 'TRANSFER_OUT');
            const transferInTransactions = createdTransactions.filter((tx) => tx.type === 'TRANSFER_IN');

            expect(await mockTransaction.count()).toBe(transactionCountBefore + 3);
            expect(transferOutTransactions).toHaveLength(1);
            expect(transferInTransactions).toHaveLength(2);
            expect(transferInTransactions.map((tx) => tx.wallet_id).sort()).toEqual([
                payerWalletA.id,
                payerWalletB.id
            ].sort());
            expect(transferInTransactions.reduce((sum, tx) => sum + Number(tx.amount), 0)).toBe(300);
        });

        it('should reject duplicate family member settlement without creating another transaction', async () => {
            const crypto = require('crypto');
            const duplicateFamilyId = crypto.randomUUID();
            const duplicatePayerId = crypto.randomUUID();
            const duplicateDebtorId = crypto.randomUUID();

            await mockUser.bulkCreate([
                { id: duplicatePayerId, name: 'Duplicate Payer' },
                { id: duplicateDebtorId, name: 'Duplicate Debtor' }
            ]);
            await mockFamily.create({ id: duplicateFamilyId, name: 'Duplicate Family', owner_id: duplicatePayerId });
            await mockFamilyMember.bulkCreate([
                { family_id: duplicateFamilyId, user_id: duplicatePayerId },
                { family_id: duplicateFamilyId, user_id: duplicateDebtorId }
            ]);

            const payerWallet = await mockWallet.create({
                name: 'Duplicate Payer Wallet',
                user_id: duplicatePayerId,
                balance: 1000
            });
            const debtorWallet = await mockWallet.create({
                name: 'Duplicate Debtor Wallet',
                user_id: duplicateDebtorId,
                balance: 1000
            });
            const sharedExpense = await mockTransaction.create({
                user_id: duplicatePayerId,
                wallet_id: payerWallet.id,
                family_id: duplicateFamilyId,
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

            mockUserId = duplicateDebtorId;
            const payload = {
                to_user_id: duplicatePayerId,
                amount: 300,
                from_wallet_id: debtorWallet.id,
                to_wallet_id: payerWallet.id,
                family_id: duplicateFamilyId
            };

            const firstRes = await request(app).post('/api/debts/settle').send(payload);
            expect(firstRes.statusCode).toEqual(200);

            const transactionCountAfterFirstSettle = await mockTransaction.count();
            const secondRes = await request(app).post('/api/debts/settle').send(payload);

            expect(secondRes.statusCode).toEqual(409);
            expect(secondRes.body.message).toBe('NO_PAYABLE_DEBT_FOUND');
            expect(await mockTransaction.count()).toBe(transactionCountAfterFirstSettle);
        });

        it('should reject family member settlement amounts greater than open debt', async () => {
            const crypto = require('crypto');
            const exceedFamilyId = crypto.randomUUID();
            const exceedPayerId = crypto.randomUUID();
            const exceedDebtorId = crypto.randomUUID();

            await mockUser.bulkCreate([
                { id: exceedPayerId, name: 'Exceed Payer' },
                { id: exceedDebtorId, name: 'Exceed Debtor' }
            ]);
            await mockFamily.create({ id: exceedFamilyId, name: 'Exceed Family', owner_id: exceedPayerId });
            await mockFamilyMember.bulkCreate([
                { family_id: exceedFamilyId, user_id: exceedPayerId },
                { family_id: exceedFamilyId, user_id: exceedDebtorId }
            ]);

            const payerWallet = await mockWallet.create({
                name: 'Exceed Payer Wallet',
                user_id: exceedPayerId,
                balance: 1000
            });
            const debtorWallet = await mockWallet.create({
                name: 'Exceed Debtor Wallet',
                user_id: exceedDebtorId,
                balance: 1000
            });
            const sharedExpense = await mockTransaction.create({
                user_id: exceedPayerId,
                wallet_id: payerWallet.id,
                family_id: exceedFamilyId,
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

            mockUserId = exceedDebtorId;
            const transactionCountBefore = await mockTransaction.count();
            const res = await request(app).post('/api/debts/settle').send({
                to_user_id: exceedPayerId,
                amount: 201,
                from_wallet_id: debtorWallet.id,
                to_wallet_id: payerWallet.id,
                family_id: exceedFamilyId
            });

            expect(res.statusCode).toEqual(400);
            expect(res.body.message).toBe('SETTLEMENT_AMOUNT_EXCEEDS_DEBT');
            expect(await mockTransaction.count()).toBe(transactionCountBefore);
        });

        it('should reject family member settlement when the debtor wallet has insufficient balance', async () => {
            const crypto = require('crypto');
            const lowBalanceFamilyId = crypto.randomUUID();
            const lowBalancePayerId = crypto.randomUUID();
            const lowBalanceDebtorId = crypto.randomUUID();

            await mockUser.bulkCreate([
                { id: lowBalancePayerId, name: 'Low Balance Payer' },
                { id: lowBalanceDebtorId, name: 'Low Balance Debtor' }
            ]);
            await mockFamily.create({ id: lowBalanceFamilyId, name: 'Low Balance Family', owner_id: lowBalancePayerId });
            await mockFamilyMember.bulkCreate([
                { family_id: lowBalanceFamilyId, user_id: lowBalancePayerId },
                { family_id: lowBalanceFamilyId, user_id: lowBalanceDebtorId }
            ]);

            const payerWallet = await mockWallet.create({
                name: 'Low Balance Payer Wallet',
                user_id: lowBalancePayerId,
                balance: 1000
            });
            const debtorWallet = await mockWallet.create({
                name: 'Low Balance Debtor Wallet',
                user_id: lowBalanceDebtorId,
                balance: 100
            });
            const sharedExpense = await mockTransaction.create({
                user_id: lowBalancePayerId,
                wallet_id: payerWallet.id,
                family_id: lowBalanceFamilyId,
                amount: 300,
                type: 'EXPENSE',
                description: 'Low balance dinner'
            });
            const debtorShare = await mockTransactionShare.create({
                transaction_id: sharedExpense.id,
                user_id: lowBalanceDebtorId,
                amount: 300,
                status: 'UNPAID',
                approval_status: 'APPROVED'
            });

            mockUserId = lowBalanceDebtorId;
            const transactionCountBefore = await mockTransaction.count();
            const res = await request(app).post('/api/debts/settle').send({
                to_user_id: lowBalancePayerId,
                amount: 300,
                from_wallet_id: debtorWallet.id,
                to_wallet_id: payerWallet.id,
                family_id: lowBalanceFamilyId
            });

            expect(res.statusCode).toEqual(400);
            expect(res.body.message).toBe('INSUFFICIENT_BALANCE');
            expect(await mockTransaction.count()).toBe(transactionCountBefore);

            const unchangedShare = await mockTransactionShare.findByPk(debtorShare.id);
            expect(unchangedShare.status).toBe('UNPAID');
            expect(Number(unchangedShare.amount)).toBe(300);
        });

        it('should reduce family shares on partial member settlements without marking them paid too early', async () => {
            const crypto = require('crypto');
            const partialFamilyId = crypto.randomUUID();
            const partialPayerId = crypto.randomUUID();
            const partialDebtorId = crypto.randomUUID();

            await mockUser.bulkCreate([
                { id: partialPayerId, name: 'Partial Payer' },
                { id: partialDebtorId, name: 'Partial Debtor' }
            ]);
            await mockFamily.create({ id: partialFamilyId, name: 'Partial Family', owner_id: partialPayerId });
            await mockFamilyMember.bulkCreate([
                { family_id: partialFamilyId, user_id: partialPayerId },
                { family_id: partialFamilyId, user_id: partialDebtorId }
            ]);

            const payerWallet = await mockWallet.create({
                name: 'Partial Payer Wallet',
                user_id: partialPayerId,
                balance: 1000
            });
            const debtorWallet = await mockWallet.create({
                name: 'Partial Debtor Wallet',
                user_id: partialDebtorId,
                balance: 1000
            });
            const sharedExpense = await mockTransaction.create({
                user_id: partialPayerId,
                wallet_id: payerWallet.id,
                family_id: partialFamilyId,
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

            mockUserId = partialDebtorId;
            const res = await request(app).post('/api/debts/settle').send({
                to_user_id: partialPayerId,
                amount: 150,
                from_wallet_id: debtorWallet.id,
                to_wallet_id: payerWallet.id,
                family_id: partialFamilyId
            });

            expect(res.statusCode).toEqual(200);

            const partiallySettledShare = await mockTransactionShare.findByPk(debtorShare.id);
            expect(partiallySettledShare.status).toBe('UNPAID');
            expect(Number(partiallySettledShare.amount)).toBe(250);

            const updatedDebtorWallet = await mockWallet.findByPk(debtorWallet.id);
            const updatedPayerWallet = await mockWallet.findByPk(payerWallet.id);
            expect(Number(updatedDebtorWallet.balance)).toBe(850);
            expect(Number(updatedPayerWallet.balance)).toBe(1150);
        });

        it('should settle optimized chained debt in a family against the final payer wallet', async () => {
            const crypto = require('crypto');
            const chainFamilyId = crypto.randomUUID();
            const ownerId = crypto.randomUUID();
            const debtorAId = crypto.randomUUID();
            const middleBId = crypto.randomUUID();
            const creditorCId = crypto.randomUUID();

            await mockUser.bulkCreate([
                { id: ownerId, name: 'Chain Owner' },
                { id: debtorAId, name: 'Chain A' },
                { id: middleBId, name: 'Chain B' },
                { id: creditorCId, name: 'Chain C' }
            ]);
            await mockFamily.create({ id: chainFamilyId, name: 'Chain Family', owner_id: ownerId });
            await mockFamilyMember.bulkCreate([
                { family_id: chainFamilyId, user_id: ownerId },
                { family_id: chainFamilyId, user_id: debtorAId },
                { family_id: chainFamilyId, user_id: middleBId },
                { family_id: chainFamilyId, user_id: creditorCId }
            ]);

            const walletA = await mockWallet.create({ name: 'Wallet A', user_id: debtorAId, balance: 1000 });
            const walletB = await mockWallet.create({ name: 'Wallet B', user_id: middleBId, balance: 1000 });
            const walletC = await mockWallet.create({ name: 'Wallet C', user_id: creditorCId, balance: 1000 });

            const transactionB = await mockTransaction.create({
                user_id: middleBId,
                wallet_id: walletB.id,
                family_id: chainFamilyId,
                amount: 500,
                type: 'EXPENSE',
                description: 'B paid for A'
            });
            const transactionC = await mockTransaction.create({
                user_id: creditorCId,
                wallet_id: walletC.id,
                family_id: chainFamilyId,
                amount: 500,
                type: 'EXPENSE',
                description: 'C paid for B'
            });

            const shareAtoB = await mockTransactionShare.create({
                transaction_id: transactionB.id,
                user_id: debtorAId,
                amount: 500,
                status: 'UNPAID',
                approval_status: 'APPROVED'
            });
            const shareBtoC = await mockTransactionShare.create({
                transaction_id: transactionC.id,
                user_id: middleBId,
                amount: 500,
                status: 'UNPAID',
                approval_status: 'APPROVED'
            });

            mockUserId = debtorAId;
            const res = await request(app).post('/api/debts/settle').send({
                to_user_id: creditorCId,
                amount: 500,
                from_wallet_id: walletA.id,
                to_wallet_id: walletC.id,
                family_id: chainFamilyId
            });

            expect(res.statusCode).toEqual(200);

            const settledAtoB = await mockTransactionShare.findByPk(shareAtoB.id);
            const settledBtoC = await mockTransactionShare.findByPk(shareBtoC.id);
            expect(settledAtoB.status).toBe('PAID');
            expect(settledBtoC.status).toBe('PAID');

            const updatedWalletA = await mockWallet.findByPk(walletA.id);
            const updatedWalletC = await mockWallet.findByPk(walletC.id);
            expect(Number(updatedWalletA.balance)).toBe(500);
            expect(Number(updatedWalletC.balance)).toBe(1500);
        });

        it('should reject owner attempts to settle on behalf of another family member', async () => {
            const crypto = require('crypto');
            const protectedFamilyId = crypto.randomUUID();
            const ownerId = crypto.randomUUID();
            const debtorId = crypto.randomUUID();
            const creditorIdForProtectedDebt = crypto.randomUUID();

            await mockUser.bulkCreate([
                { id: ownerId, name: 'Protected Owner' },
                { id: debtorId, name: 'Protected Debtor' },
                { id: creditorIdForProtectedDebt, name: 'Protected Creditor' }
            ]);
            await mockFamily.create({
                id: protectedFamilyId,
                name: 'Protected Family',
                owner_id: ownerId
            });
            await mockFamilyMember.bulkCreate([
                { family_id: protectedFamilyId, user_id: ownerId },
                { family_id: protectedFamilyId, user_id: debtorId },
                { family_id: protectedFamilyId, user_id: creditorIdForProtectedDebt }
            ]);

            const ownerWallet = await mockWallet.create({ name: 'Owner Wallet', user_id: ownerId, balance: 1000 });
            const creditorWallet = await mockWallet.create({
                name: 'Creditor Wallet',
                user_id: creditorIdForProtectedDebt,
                balance: 1000
            });
            const protectedTx = await mockTransaction.create({
                user_id: creditorIdForProtectedDebt,
                wallet_id: creditorWallet.id,
                family_id: protectedFamilyId,
                amount: 250,
                type: 'EXPENSE',
                description: 'Protected dinner'
            });
            await mockTransactionShare.create({
                transaction_id: protectedTx.id,
                user_id: debtorId,
                amount: 250,
                status: 'UNPAID',
                approval_status: 'APPROVED'
            });

            const transactionCountBefore = await mockTransaction.count();
            mockUserId = ownerId;
            const res = await request(app).post('/api/debts/settle').send({
                from_user_id: debtorId,
                to_user_id: creditorIdForProtectedDebt,
                amount: 250,
                from_wallet_id: ownerWallet.id,
                to_wallet_id: creditorWallet.id,
                family_id: protectedFamilyId
            });

            expect(res.statusCode).toEqual(400);
            expect(res.body.message).toBe('INVALID_SETTLEMENT_USERS');
            expect(await mockTransaction.count()).toBe(transactionCountBefore);
        });
    });
});
