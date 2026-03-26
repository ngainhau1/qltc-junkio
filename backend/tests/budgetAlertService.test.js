jest.mock('../models', () => {
    const mockBudget = { findAll: jest.fn() };
    const mockTransaction = { sum: jest.fn() };
    const mockNotification = { findOne: jest.fn(), create: jest.fn() };
    const mockFamilyMember = { findAll: jest.fn() };

    return {
        Budget: mockBudget,
        Transaction: mockTransaction,
        Notification: mockNotification,
        FamilyMember: mockFamilyMember,
        __mocks: { mockBudget, mockTransaction, mockNotification, mockFamilyMember }
    };
});

jest.mock('../config/socket', () => {
    const mockTo = jest.fn().mockReturnThis();
    const mockEmit = jest.fn();

    return {
        getIO: jest.fn(() => ({
            to: mockTo,
            emit: mockEmit
        })),
        __mocks: { mockTo, mockEmit }
    };
});

const { checkBudgetAlerts } = require('../services/budgetAlertService');
const { __mocks } = require('../models');
const { __mocks: socketMocks } = require('../config/socket');

const { mockBudget, mockTransaction, mockNotification, mockFamilyMember } = __mocks;

describe('budgetAlertService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('creates a personal budget alert for the budget owner', async () => {
        mockBudget.findAll.mockResolvedValue([
            {
                id: 'budget-1',
                category_id: 'category-1',
                amount_limit: 1000,
                user_id: 'user-1',
                family_id: null,
                start_date: new Date('2026-03-01'),
                end_date: new Date('2026-03-31')
            }
        ]);
        mockTransaction.sum.mockResolvedValue(850);
        mockNotification.findOne.mockResolvedValue(null);
        mockNotification.create.mockResolvedValue({
            id: 'notif-1',
            user_id: 'user-1',
            type: 'BUDGET_WARNING',
            title: 'Warning',
            message: 'Budget warning',
            reference_id: 'budget-1',
            created_at: new Date('2026-03-26T08:00:00.000Z'),
            isRead: false
        });

        await checkBudgetAlerts();

        expect(mockNotification.create).toHaveBeenCalledWith(expect.objectContaining({
            user_id: 'user-1',
            type: 'BUDGET_WARNING',
            reference_id: 'budget-1'
        }));
        expect(socketMocks.mockTo).toHaveBeenCalledWith('user-1');
        expect(socketMocks.mockEmit).toHaveBeenCalledWith('NEW_NOTIFICATION', expect.objectContaining({
            user_id: 'user-1',
            reference_id: 'budget-1'
        }));
    });

    it('creates family budget alerts for each family member', async () => {
        mockBudget.findAll.mockResolvedValue([
            {
                id: 'budget-2',
                category_id: 'category-2',
                amount_limit: 1000,
                user_id: null,
                family_id: 'family-1',
                start_date: new Date('2026-03-01'),
                end_date: new Date('2026-03-31')
            }
        ]);
        mockTransaction.sum.mockResolvedValue(1000);
        mockFamilyMember.findAll.mockResolvedValue([
            { user_id: 'member-1' },
            { user_id: 'member-2' }
        ]);
        mockNotification.findOne
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(null);
        mockNotification.create
            .mockResolvedValueOnce({
                id: 'notif-2a',
                user_id: 'member-1',
                type: 'BUDGET_EXCEEDED',
                title: 'Exceeded',
                message: 'Budget exceeded',
                reference_id: 'budget-2',
                created_at: new Date('2026-03-26T08:00:00.000Z'),
                isRead: false
            })
            .mockResolvedValueOnce({
                id: 'notif-2b',
                user_id: 'member-2',
                type: 'BUDGET_EXCEEDED',
                title: 'Exceeded',
                message: 'Budget exceeded',
                reference_id: 'budget-2',
                created_at: new Date('2026-03-26T08:00:00.000Z'),
                isRead: false
            });

        await checkBudgetAlerts();

        expect(mockFamilyMember.findAll).toHaveBeenCalledWith(expect.objectContaining({
            where: { family_id: 'family-1' },
            attributes: ['user_id']
        }));
        expect(mockNotification.create).toHaveBeenCalledTimes(2);
        expect(socketMocks.mockTo).toHaveBeenNthCalledWith(1, 'member-1');
        expect(socketMocks.mockTo).toHaveBeenNthCalledWith(2, 'member-2');
    });

    it('deduplicates alerts per recipient per day', async () => {
        mockBudget.findAll.mockResolvedValue([
            {
                id: 'budget-3',
                category_id: 'category-3',
                amount_limit: 1000,
                user_id: 'user-3',
                family_id: null,
                start_date: new Date('2026-03-01'),
                end_date: new Date('2026-03-31')
            }
        ]);
        mockTransaction.sum.mockResolvedValue(900);
        mockNotification.findOne.mockResolvedValue({ id: 'existing-notif' });

        await checkBudgetAlerts();

        expect(mockNotification.create).not.toHaveBeenCalled();
        expect(socketMocks.mockEmit).not.toHaveBeenCalled();
    });
});
