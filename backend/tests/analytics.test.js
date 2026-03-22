const request = require('supertest');
const express = require('express');
const { Sequelize, DataTypes, Op } = require('sequelize');

// Setup mock DB & model
const mockSequelize = new Sequelize('sqlite::memory:', { logging: false });

const mockUser = mockSequelize.define('User', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING }
});

const mockFamilyMember = mockSequelize.define('FamilyMember', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    user_id: { type: DataTypes.UUID },
    family_id: { type: DataTypes.UUID }
});

const mockWallet = mockSequelize.define('Wallet', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING },
    user_id: { type: DataTypes.UUID },
    family_id: { type: DataTypes.UUID },
    balance: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 }
});

const mockCategory = mockSequelize.define('Category', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING },
    icon: { type: DataTypes.STRING }
});

const mockTransaction = mockSequelize.define('Transaction', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    wallet_id: { type: DataTypes.UUID },
    category_id: { type: DataTypes.UUID },
    amount: { type: DataTypes.DECIMAL(15, 2) },
    date: { type: DataTypes.DATE },
    type: { type: DataTypes.STRING }
});

const mockGoal = mockSequelize.define('Goal', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true }
});

mockTransaction.belongsTo(mockCategory, { foreignKey: 'category_id' });
mockTransaction.belongsTo(mockWallet, { foreignKey: 'wallet_id' });

jest.mock('../models', () => ({
    sequelize: mockSequelize,
    User: mockUser,
    FamilyMember: mockFamilyMember,
    Wallet: mockWallet,
    Transaction: mockTransaction,
    Category: mockCategory,
    Goal: mockGoal
}));

let mockUserId;
jest.mock('../middleware/authMiddleware', () => (req, res, next) => {
    req.user = { id: mockUserId, role: 'USER' };
    next();
});

const analyticsRoutes = require('../routes/analyticsRoutes');

const app = express();
app.use(express.json());
app.use('/api/analytics', analyticsRoutes);

describe('Analytics API', () => {
    let userId, familyId;

    beforeAll(async () => {
        await mockSequelize.sync({ force: true });
        const crypto = require('crypto');
        userId = crypto.randomUUID();
        familyId = crypto.randomUUID();

        // user is in a family
        await mockFamilyMember.create({ user_id: userId, family_id: familyId });

        // Personal Wallet
        const pw = await mockWallet.create({ user_id: userId, balance: 1000 });
        
        // Family Wallet
        const fw = await mockWallet.create({ family_id: familyId, balance: 2500 });

        const catId = crypto.randomUUID();
        await mockCategory.create({ id: catId, name: 'Food', icon: 'burger' });

        const today = new Date();
        
        // Income
        await mockTransaction.create({
            wallet_id: pw.id, category_id: catId, amount: 2000, type: 'INCOME', date: today
        });

        // Expense
        await mockTransaction.create({
            wallet_id: fw.id, category_id: catId, amount: 500, type: 'EXPENSE', date: today
        });

    });

    afterAll(async () => {
        await mockSequelize.close();
    });

    describe('GET /api/analytics/dashboard', () => {
        it('should return aggregated dashboard stats', async () => {
            mockUserId = userId;
            const res = await request(app).get('/api/analytics/dashboard');
            expect(res.statusCode).toEqual(200);
            expect(res.body.data.stats).toBeDefined();
            
            // Personal(1000) + Family(2500) = 3500 assets
            expect(res.body.data.stats.totalAssets).toBe(3500); 
            expect(res.body.data.stats.totalIncome).toBe(2000);
            expect(res.body.data.stats.totalExpense).toBe(500);
            expect(res.body.data.stats.activeWalletsCount).toBe(2);
            expect(res.body.data.stats.transactionsThisMonthCount).toBe(2);

            expect(res.body.data.recentTransactions.length).toBe(2);
            expect(res.body.data.recentTransactions[0].Category.name).toBe('Food');
        });
    });

    describe('GET /api/analytics/reports', () => {
        it('should return reports structure', async () => {
            mockUserId = userId;
            const res = await request(app).get('/api/analytics/reports');
            expect(res.statusCode).toEqual(200);
            expect(res.body.data.summary).toBeDefined();
            expect(res.body.data.expenseByCategory).toBeInstanceOf(Array);
            expect(res.body.data.cashflowSeries).toBeInstanceOf(Array);
        });
    });
});
