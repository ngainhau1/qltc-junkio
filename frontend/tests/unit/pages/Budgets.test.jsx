import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Budgets } from '@/pages/Budgets';

const {
    mockDispatch,
    mockState,
    fetchBudgetsMock,
    deleteBudgetMock,
    fetchCategoriesMock,
    toastSuccessMock,
    toastErrorMock,
} = vi.hoisted(() => {
    const fetchBudgetsAction = vi.fn(() => ({ type: 'budgets/fetchBudgets' }));
    const fetchCategoriesAction = vi.fn(() => ({ type: 'categories/fetchAll' }));
    const deleteBudgetAction = vi.fn((id) => ({
        type: 'budgets/deleteBudget',
        meta: { arg: id },
        unwrap: vi.fn().mockResolvedValue(id),
    }));

    return {
        mockDispatch: vi.fn((action) => action),
        mockState: {},
        fetchBudgetsMock: fetchBudgetsAction,
        deleteBudgetMock: deleteBudgetAction,
        fetchCategoriesMock: fetchCategoriesAction,
        toastSuccessMock: vi.fn(),
        toastErrorMock: vi.fn(),
    };
});

vi.mock('react-redux', () => ({
    useDispatch: () => mockDispatch,
    useSelector: (selector) => selector(mockState),
}));

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key, params) => {
            if (params?.target) {
                return `${key}:${params.target}`;
            }
            if (params?.name) {
                return `${key}:${params.name}`;
            }
            return key;
        },
    }),
    initReactI18next: { type: '3rdParty', init: vi.fn() },
}));

vi.mock('sonner', () => ({
    toast: {
        success: toastSuccessMock,
        error: toastErrorMock,
    },
}));

vi.mock('@/features/budgets/budgetSlice', () => ({
    fetchBudgets: fetchBudgetsMock,
    deleteBudget: deleteBudgetMock,
}));

vi.mock('@/features/categories/categorySlice', () => ({
    fetchCategories: fetchCategoriesMock,
}));

vi.mock('@/components/layout/PageHeader', () => ({
    PageHeader: ({ title, description, actions }) => (
        <div>
            <h1>{title}</h1>
            <p>{description}</p>
            {actions}
        </div>
    ),
}));

vi.mock('@/components/ui/button', () => ({
    Button: ({ children, ...props }) => <button {...props}>{children}</button>,
}));

vi.mock('@/components/ui/card', () => ({
    Card: ({ children, ...props }) => <div {...props}>{children}</div>,
    CardHeader: ({ children, ...props }) => <div {...props}>{children}</div>,
    CardTitle: ({ children, ...props }) => <h2 {...props}>{children}</h2>,
    CardContent: ({ children, ...props }) => <div {...props}>{children}</div>,
}));

vi.mock('@/components/ui/badge', () => ({
    Badge: ({ children, ...props }) => <div {...props}>{children}</div>,
}));

vi.mock('@/components/ui/empty-state', () => ({
    EmptyState: ({ title, description, action }) => (
        <div data-testid="budgets-empty-state">
            <div>{title}</div>
            <div>{description}</div>
            {action}
        </div>
    ),
}));

vi.mock('@/components/ui/modal', () => ({
    Modal: ({ isOpen, children, contentTestId }) => (isOpen ? <div data-testid={contentTestId}>{children}</div> : null),
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
    DropdownMenu: ({ children }) => <div>{children}</div>,
    DropdownMenuTrigger: ({ children }) => <div>{children}</div>,
    DropdownMenuContent: ({ children }) => <div>{children}</div>,
    DropdownMenuItem: ({ children, ...props }) => <button {...props}>{children}</button>,
}));

vi.mock('@/components/features/budgets/BudgetForm', () => ({
    BudgetForm: ({ initialData, categories }) => (
        <div
            data-testid="budget-form"
            data-budget-id={initialData?.id || ''}
            data-category-count={categories.length}
        />
    ),
}));

vi.mock('@/lib/utils', () => ({
    formatCurrency: (amount) => `currency:${amount}`,
    formatShortDate: (value) => `date:${value}`,
}));

describe('Budgets page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        Object.assign(mockState, {
            budgets: {
                items: [],
                isLoading: false,
                deletingId: null,
            },
            categories: {
                categories: [{ id: 'cat-1', name: 'Groceries', type: 'EXPENSE' }],
                isLoading: false,
            },
            families: {
                activeFamilyId: null,
                families: [{ id: 'fam-1', name: 'Demo Family' }],
            },
        });
    });

    it('dispatches budgets and categories fetches on mount', () => {
        render(<Budgets />);

        expect(fetchBudgetsMock).toHaveBeenCalledTimes(1);
        expect(fetchCategoriesMock).toHaveBeenCalledTimes(1);
        expect(mockDispatch).toHaveBeenCalledWith({ type: 'budgets/fetchBudgets' });
        expect(mockDispatch).toHaveBeenCalledWith({ type: 'categories/fetchAll' });
    });

    it('renders the personal empty state when there are no personal budgets', () => {
        mockState.budgets.items = [
            {
                id: 'budget-family',
                amount_limit: 2500,
                family_id: 'fam-1',
                start_date: '2026-04-01',
                end_date: '2026-04-30',
                Category: { name: 'Family Only', icon: 'Cart' },
            },
        ];

        render(<Budgets />);

        expect(screen.getByText('budgets.context.emptyPersonalTitle')).toBeTruthy();
        expect(screen.queryByText('Family Only')).toBeNull();
    });

    it('shows only the budgets that belong to the active family scope', () => {
        mockState.families.activeFamilyId = 'fam-1';
        mockState.budgets.items = [
            {
                id: 'budget-personal',
                amount_limit: 1800,
                family_id: null,
                start_date: '2026-04-01',
                end_date: '2026-04-30',
                Category: { name: 'Personal Only', icon: 'Cart' },
            },
            {
                id: 'budget-family',
                amount_limit: 3200,
                family_id: 'fam-1',
                start_date: '2026-05-01',
                end_date: '2026-05-31',
                Category: { name: 'Family Only', icon: 'Cart' },
            },
        ];

        render(<Budgets />);

        expect(screen.getByText('Family Only')).toBeTruthy();
        expect(screen.queryByText('Personal Only')).toBeNull();
    });

    it('disables create when there are no expense categories', () => {
        mockState.categories.categories = [{ id: 'income-1', name: 'Salary', type: 'INCOME' }];

        render(<Budgets />);

        expect(screen.getByTestId('budgets-create-button').disabled).toBe(true);
        expect(screen.getByText('budgets.noCategoriesTitle')).toBeTruthy();
    });

    it('opens the edit modal with the selected budget', () => {
        mockState.budgets.items = [
            {
                id: 'budget-1',
                amount_limit: 2100,
                family_id: null,
                start_date: '2026-04-01',
                end_date: '2026-04-30',
                Category: { name: 'Groceries', icon: 'Cart' },
            },
        ];

        render(<Budgets />);

        fireEvent.click(screen.getByText('common.edit'));

        expect(screen.getByTestId('budget-edit-modal')).toBeTruthy();
        expect(screen.getByTestId('budget-form').getAttribute('data-budget-id')).toBe('budget-1');
    });

    it('opens the delete modal and dispatches delete on confirm', async () => {
        mockState.budgets.items = [
            {
                id: 'budget-1',
                amount_limit: 2100,
                family_id: null,
                start_date: '2026-04-01',
                end_date: '2026-04-30',
                Category: { name: 'Groceries', icon: 'Cart' },
            },
        ];

        render(<Budgets />);

        fireEvent.click(screen.getAllByText('common.delete')[0]);
        expect(screen.getByTestId('budget-delete-modal')).toBeTruthy();

        fireEvent.click(screen.getAllByText('common.delete')[1]);

        await waitFor(() => expect(deleteBudgetMock).toHaveBeenCalledWith('budget-1'));
        expect(toastSuccessMock).toHaveBeenCalledWith('budgets.deleteSuccess');
    });
});
