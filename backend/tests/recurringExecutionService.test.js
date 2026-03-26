jest.mock('../models', () => {
    const mockPattern = { findAll: jest.fn() };
    const mockTransaction = { create: jest.fn() };
    const mockWallet = { findByPk: jest.fn() };
    const mockSequelize = {
        transaction: jest.fn()
    };

    return {
        RecurringPattern: mockPattern,
        Transaction: mockTransaction,
        Wallet: mockWallet,
        sequelize: mockSequelize,
        __mocks: { mockPattern, mockTransaction, mockWallet, mockSequelize }
    };
});

const { executeDueRecurringPatterns } = require('../services/recurringExecutionService');
const { __mocks } = require('../models');

const { mockPattern, mockTransaction, mockWallet, mockSequelize } = __mocks;

describe('recurringExecutionService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('processes an overdue pattern only once and advances one cycle', async () => {
        const dbTransaction = {
            commit: jest.fn(),
            rollback: jest.fn()
        };
        const pattern = {
            id: 'pattern-1',
            amount: 100,
            description: 'Daily coffee',
            type: 'EXPENSE',
            wallet_id: 'wallet-1',
            category_id: 'category-1',
            user_id: 'user-1',
            frequency: 'DAILY',
            next_run_date: '2026-03-20',
            save: jest.fn()
        };
        const wallet = {
            id: 'wallet-1',
            balance: 1000,
            family_id: null,
            save: jest.fn()
        };

        mockSequelize.transaction.mockResolvedValue(dbTransaction);
        mockPattern.findAll.mockResolvedValue([pattern]);
        mockWallet.findByPk.mockResolvedValue(wallet);

        const result = await executeDueRecurringPatterns({ today: new Date('2026-03-26T00:05:00.000Z') });

        expect(mockTransaction.create).toHaveBeenCalledWith(expect.objectContaining({
            wallet_id: 'wallet-1',
            date: '2026-03-26',
            family_id: null
        }), expect.anything());
        expect(pattern.next_run_date).toBe('2026-03-21');
        expect(pattern.save).toHaveBeenCalled();
        expect(wallet.balance).toBe(900);
        expect(wallet.save).toHaveBeenCalled();
        expect(dbTransaction.commit).toHaveBeenCalled();
        expect(result).toEqual(expect.objectContaining({
            processedCount: 1,
            skippedCount: 0,
            failedCount: 0,
            patternsCount: 1
        }));
    });

    it('skips expense patterns when the wallet balance is insufficient', async () => {
        const dbTransaction = {
            commit: jest.fn(),
            rollback: jest.fn()
        };
        const pattern = {
            id: 'pattern-2',
            amount: 1500,
            description: 'Rent',
            type: 'EXPENSE',
            wallet_id: 'wallet-2',
            category_id: 'category-2',
            user_id: 'user-2',
            frequency: 'MONTHLY',
            next_run_date: '2026-03-01',
            save: jest.fn()
        };
        const wallet = {
            id: 'wallet-2',
            balance: 1000,
            family_id: null,
            save: jest.fn()
        };

        mockSequelize.transaction.mockResolvedValue(dbTransaction);
        mockPattern.findAll.mockResolvedValue([pattern]);
        mockWallet.findByPk.mockResolvedValue(wallet);

        const result = await executeDueRecurringPatterns({ today: new Date('2026-03-26T00:05:00.000Z') });

        expect(mockTransaction.create).not.toHaveBeenCalled();
        expect(pattern.save).not.toHaveBeenCalled();
        expect(wallet.save).not.toHaveBeenCalled();
        expect(dbTransaction.rollback).toHaveBeenCalled();
        expect(result).toEqual(expect.objectContaining({
            processedCount: 0,
            skippedCount: 1,
            failedCount: 0,
            patternsCount: 1
        }));
    });
});
