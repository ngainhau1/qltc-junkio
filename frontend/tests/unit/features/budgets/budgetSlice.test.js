import { beforeEach, describe, expect, it, vi } from 'vitest';
import reducer, {
    createBudget,
    deleteBudget,
    fetchBudgets,
    updateBudget,
} from '@/features/budgets/budgetSlice';
import api from '@/lib/api';

vi.mock('@/lib/api', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
    },
}));

const baseState = {
    items: [],
    isLoading: false,
    isSubmitting: false,
    deletingId: null,
    error: null,
};

describe('budgetSlice', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('fetchBudgets success populates items', async () => {
        const budgets = [{ id: 'budget-1', amount_limit: 1500 }];
        api.get.mockResolvedValue({ data: budgets });

        const result = await fetchBudgets()(vi.fn(), () => ({}), undefined);

        expect(api.get).toHaveBeenCalledWith('/budgets');
        expect(result.type).toBe('budgets/fetchBudgets/fulfilled');

        const next = reducer(baseState, result);
        expect(next.items).toEqual(budgets);
        expect(next.isLoading).toBe(false);
    });

    it('fetchBudgets reject stores backend error code', async () => {
        api.get.mockRejectedValue({
            response: {
                data: {
                    message: 'BUDGET_LOAD_FAILED',
                },
            },
        });

        const result = await fetchBudgets()(vi.fn(), () => ({}), undefined);

        expect(result.type).toBe('budgets/fetchBudgets/rejected');

        const next = reducer(baseState, result);
        expect(next.error).toBe('BUDGET_LOAD_FAILED');
    });

    it('createBudget sends payload through and prepends the created budget', async () => {
        const payload = {
            category_id: 'cat-1',
            amount_limit: 2200,
            start_date: '2026-04-01',
            end_date: '2026-04-30',
        };
        const created = { id: 'budget-2', ...payload };
        api.post.mockResolvedValue({ data: created });

        const result = await createBudget(payload)(vi.fn(), () => ({}), undefined);

        expect(api.post).toHaveBeenCalledWith('/budgets', payload);

        const next = reducer(baseState, result);
        expect(next.items[0]).toEqual(created);
        expect(next.isSubmitting).toBe(false);
    });

    it('updateBudget replaces the matching budget item', async () => {
        const state = {
            ...baseState,
            items: [
                { id: 'budget-1', amount_limit: 1000 },
                { id: 'budget-2', amount_limit: 2000 },
            ],
        };
        const updated = { id: 'budget-2', amount_limit: 2600 };
        api.put.mockResolvedValue({ data: updated });

        const result = await updateBudget({
            id: 'budget-2',
            data: { amount_limit: 2600 },
        })(vi.fn(), () => ({}), undefined);

        expect(api.put).toHaveBeenCalledWith('/budgets/budget-2', { amount_limit: 2600 });

        const next = reducer(state, result);
        expect(next.items).toEqual([
            { id: 'budget-1', amount_limit: 1000 },
            { id: 'budget-2', amount_limit: 2600 },
        ]);
    });

    it('deleteBudget removes the deleted budget item', async () => {
        const state = {
            ...baseState,
            items: [
                { id: 'budget-1', amount_limit: 1000 },
                { id: 'budget-2', amount_limit: 2000 },
            ],
        };
        api.delete.mockResolvedValue({});

        const result = await deleteBudget('budget-1')(vi.fn(), () => ({}), undefined);

        expect(api.delete).toHaveBeenCalledWith('/budgets/budget-1');

        const next = reducer(state, result);
        expect(next.items).toEqual([{ id: 'budget-2', amount_limit: 2000 }]);
        expect(next.deletingId).toBeNull();
    });
});
