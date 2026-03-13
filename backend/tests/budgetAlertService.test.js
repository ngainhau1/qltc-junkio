jest.mock('../models', () => {
    const mockBudget = { findAll: jest.fn() };
    const mockTransaction = { sum: jest.fn() };
    const mockNotification = { findOne: jest.fn(), create: jest.fn() };
    return {
        Budget: mockBudget,
        Transaction: mockTransaction,
        Notification: mockNotification,
        __mocks: { mockBudget, mockTransaction, mockNotification }
    };
});

const { checkBudgetAlerts } = require('../services/budgetAlertService');
const { __mocks } = require('../models');
const { mockBudget, mockTransaction, mockNotification } = __mocks;

describe('budgetAlertService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('tạo cảnh báo khi chi tiêu vượt 80%', async () => {
        mockBudget.findAll.mockResolvedValue([
            { id: 'b1', category_id: 'c1', amount_limit: 1000, family_id: 'fam1', start_date: new Date('2026-03-01'), end_date: new Date('2026-03-31') }
        ]);
        mockTransaction.sum.mockResolvedValue(850); // 85%
        mockNotification.findOne.mockResolvedValue(null);
        mockNotification.create.mockResolvedValue({ id: 'n1' });

        await checkBudgetAlerts();

        expect(mockNotification.create).toHaveBeenCalledWith(expect.objectContaining({
            type: 'BUDGET_WARNING',
            reference_id: 'b1'
        }));
    });

    it('không tạo cảnh báo nếu chưa đến 80%', async () => {
        mockBudget.findAll.mockResolvedValue([
            { id: 'b1', category_id: 'c1', amount_limit: 1000, family_id: 'fam1', start_date: new Date('2026-03-01'), end_date: new Date('2026-03-31') }
        ]);
        mockTransaction.sum.mockResolvedValue(500); // 50%
        await checkBudgetAlerts();
        expect(mockNotification.create).not.toHaveBeenCalled();
    });
});
