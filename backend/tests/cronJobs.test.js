jest.useFakeTimers();

jest.mock('node-cron', () => {
    const jobs = [];
    const schedule = jest.fn((expr, fn) => {
        jobs.push(fn);
        return { stop: jest.fn() };
    });
    return { schedule, __jobs: jobs };
});

jest.mock('../models', () => {
    const mockPattern = { findAll: jest.fn() };
    const mockTx = { create: jest.fn() };
    const mockWallet = { findByPk: jest.fn() };
    const mockSequelize = { transaction: jest.fn(async () => ({ commit: jest.fn(), rollback: jest.fn() })) };
    return {
        RecurringPattern: mockPattern,
        Transaction: mockTx,
        Wallet: mockWallet,
        sequelize: mockSequelize,
        __mocks: { mockPattern, mockTx, mockWallet, mockSequelize }
    };
});

jest.mock('../config/socket', () => ({
    getIO: jest.fn(() => ({
        to: jest.fn().mockReturnThis(),
        emit: jest.fn()
    }))
}));

const { startCronJobs } = require('../services/cronJobs');
const cron = require('node-cron');
const { __mocks } = require('../models');

describe('cronJobs recurring engine', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        cron.__jobs.length = 0;
    });

    it('tạo giao dịch từ recurring pattern đến hạn', async () => {
        // Arrange
        __mocks.mockPattern.findAll.mockResolvedValue([{
            id: 'r1',
            amount: 100,
            date: new Date(),
            description: 'Auto',
            type: 'EXPENSE',
            wallet_id: 'w1',
            category_id: 'c1',
            user_id: 'u1',
            frequency: 'DAILY',
            next_run_date: new Date().toISOString().split('T')[0],
            save: jest.fn()
        }]);
        const walletMock = { balance: 1000, save: jest.fn() };
        __mocks.mockWallet.findByPk.mockResolvedValue(walletMock);

        startCronJobs();

        // Act: trigger the scheduled job manually
        await cron.__jobs[0]();

        // Assert
        expect(__mocks.mockTx.create).toHaveBeenCalledWith(expect.objectContaining({
            amount: 100,
            wallet_id: 'w1'
        }), expect.anything());
        expect(walletMock.save).toHaveBeenCalled();
    });
});
