import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BudgetForm } from '@/components/features/budgets/BudgetForm';

const {
    mockDispatch,
    mockState,
    createBudgetMock,
    updateBudgetMock,
    toastSuccessMock,
} = vi.hoisted(() => {
    const createBudgetAction = vi.fn((payload) => ({
        type: 'budgets/createBudget',
        payload,
        unwrap: vi.fn().mockResolvedValue({ id: 'created-budget', ...payload }),
    }));

    const updateBudgetAction = vi.fn((payload) => ({
        type: 'budgets/updateBudget',
        payload,
        unwrap: vi.fn().mockResolvedValue({ id: payload.id, ...payload.data }),
    }));

    return {
        mockDispatch: vi.fn((action) => action),
        mockState: {},
        createBudgetMock: createBudgetAction,
        updateBudgetMock: updateBudgetAction,
        toastSuccessMock: vi.fn(),
    };
});

vi.mock('react-redux', () => ({
    useDispatch: () => mockDispatch,
    useSelector: (selector) => selector(mockState),
}));

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key, params) => params?.name || params?.target ? `${key}:${params?.name || params?.target}` : key,
    }),
    initReactI18next: { type: '3rdParty', init: vi.fn() },
}));

vi.mock('sonner', () => ({
    toast: {
        success: toastSuccessMock,
    },
}));

vi.mock('@/features/budgets/budgetSlice', () => ({
    default: () => ({
        items: [],
        isLoading: false,
        isSubmitting: false,
        deletingId: null,
        error: null,
    }),
    createBudget: createBudgetMock,
    updateBudget: updateBudgetMock,
}));

vi.mock('@/components/ui/select', () => ({
    Select: ({ value, onValueChange, disabled, children }) => (
        <select
            data-testid="budget-category-select"
            value={value}
            disabled={disabled}
            onChange={(event) => onValueChange(event.target.value)}
        >
            {children}
        </select>
    ),
    SelectTrigger: ({ children }) => <>{children}</>,
    SelectValue: ({ placeholder }) => <option value="">{placeholder}</option>,
    SelectContent: ({ children }) => <>{children}</>,
    SelectItem: ({ value, children }) => <option value={value}>{children}</option>,
}));

describe('BudgetForm', () => {
    const categories = [
        { id: 'cat-expense', name: 'Groceries', type: 'EXPENSE' },
        { id: 'cat-income', name: 'Salary', type: 'INCOME' },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        Object.assign(mockState, {
            families: {
                activeFamilyId: null,
                families: [{ id: 'fam-1', name: 'Demo Family' }],
            },
            budgets: {
                isSubmitting: false,
            },
        });
    });

    it('shows validation errors for required fields', async () => {
        render(<BudgetForm categories={categories} />);

        fireEvent.click(screen.getByRole('button', { name: 'budgets.form.createPersonalBtn' }));

        expect(await screen.findByText('budgets.form.validation.categoryRequired')).toBeTruthy();
        expect(screen.getByText('budgets.form.validation.amountRequired')).toBeTruthy();
        expect(screen.getByText('budgets.form.validation.startDateRequired')).toBeTruthy();
        expect(screen.getByText('budgets.form.validation.endDateRequired')).toBeTruthy();
    });

    it('submits a personal budget payload without family_id', async () => {
        const onSuccess = vi.fn();
        render(<BudgetForm categories={categories} onSuccess={onSuccess} />);

        fireEvent.change(screen.getByTestId('budget-category-select'), { target: { value: 'cat-expense' } });
        fireEvent.change(screen.getByLabelText('budgets.form.amount'), { target: { value: '3400' } });
        fireEvent.change(screen.getByLabelText('budgets.form.startDate'), { target: { value: '2026-04-01' } });
        fireEvent.change(screen.getByLabelText('budgets.form.endDate'), { target: { value: '2026-04-30' } });
        fireEvent.click(screen.getByRole('button', { name: 'budgets.form.createPersonalBtn' }));

        await waitFor(() => expect(createBudgetMock).toHaveBeenCalledTimes(1));

        const payload = createBudgetMock.mock.calls[0][0];
        expect(payload).toMatchObject({
            category_id: 'cat-expense',
            amount_limit: 3400,
            start_date: '2026-04-01',
            end_date: '2026-04-30',
        });
        expect(payload).not.toHaveProperty('family_id');
        expect(onSuccess).toHaveBeenCalledTimes(1);
        expect(toastSuccessMock).toHaveBeenCalledWith('budgets.createSuccess');
    });

    it('adds the active family id when creating a family budget', async () => {
        mockState.families.activeFamilyId = 'fam-1';

        render(<BudgetForm categories={categories} />);

        fireEvent.change(screen.getByTestId('budget-category-select'), { target: { value: 'cat-expense' } });
        fireEvent.change(screen.getByLabelText('budgets.form.amount'), { target: { value: '5100' } });
        fireEvent.change(screen.getByLabelText('budgets.form.startDate'), { target: { value: '2026-05-01' } });
        fireEvent.change(screen.getByLabelText('budgets.form.endDate'), { target: { value: '2026-05-31' } });
        fireEvent.click(screen.getByRole('button', { name: 'budgets.form.createFamilyBtn' }));

        await waitFor(() => expect(createBudgetMock).toHaveBeenCalledTimes(1));

        expect(createBudgetMock.mock.calls[0][0]).toMatchObject({
            category_id: 'cat-expense',
            amount_limit: 5100,
            start_date: '2026-05-01',
            end_date: '2026-05-31',
            family_id: 'fam-1',
        });
    });

    it('prefills edit mode and updates without changing scope', async () => {
        const initialData = {
            id: 'budget-1',
            category_id: 'cat-expense',
            amount_limit: 1800,
            start_date: '2026-03-01',
            end_date: '2026-03-31',
            family_id: 'fam-1',
        };

        render(<BudgetForm categories={categories} initialData={initialData} />);

        expect(screen.getByDisplayValue('1800')).toBeTruthy();
        expect(screen.getByDisplayValue('2026-03-01')).toBeTruthy();
        expect(screen.getByDisplayValue('2026-03-31')).toBeTruthy();

        fireEvent.change(screen.getByLabelText('budgets.form.amount'), { target: { value: '2100' } });
        fireEvent.click(screen.getByRole('button', { name: 'budgets.form.saveBtn' }));

        await waitFor(() => expect(updateBudgetMock).toHaveBeenCalledTimes(1));

        expect(updateBudgetMock.mock.calls[0][0]).toEqual({
            id: 'budget-1',
            data: {
                category_id: 'cat-expense',
                amount_limit: 2100,
                start_date: '2026-03-01',
                end_date: '2026-03-31',
            },
        });
    });
});
