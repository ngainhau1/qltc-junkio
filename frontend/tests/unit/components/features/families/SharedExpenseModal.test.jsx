import { beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SharedExpenseModal } from '@/components/features/families/SharedExpenseModal';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import authReducer from '@/features/auth/authSlice';
import familyReducer from '@/features/families/familySlice';
import transactionReducer from '@/features/transactions/transactionSlice';
import walletReducer from '@/features/wallets/walletSlice';

const { mockApiPost, mockToastError } = vi.hoisted(() => ({
  mockApiPost: vi.fn(),
  mockToastError: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  default: {
    post: mockApiPost,
    get: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/features/finance/refreshFinanceData', () => ({
  refreshFinanceData: () => async () => undefined,
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: mockToastError,
  },
}));

vi.mock('@/components/ui/modal', () => ({
  Modal: ({ children }) => <div data-testid="modal">{children}</div>,
}));
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }) => <button {...props}>{children}</button>,
}));
vi.mock('@/components/ui/input', () => ({
  Input: (props) => <input {...props} />,
}));
vi.mock('@/components/ui/label', () => ({
  Label: (props) => <label {...props} />,
}));
vi.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }) => (
    <select value={value} onChange={(event) => onValueChange(event.target.value)} data-testid="wallet-select">
      {children}
    </select>
  ),
  SelectContent: ({ children }) => <>{children}</>,
  SelectTrigger: ({ children }) => <>{children}</>,
  SelectValue: () => null,
  SelectItem: ({ value, children }) => <option value={value}>{children}</option>,
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k, opts) => (opts?.amount ? String(opts.amount) : k), i18n: { language: 'vi', changeLanguage: () => {} } }),
  initReactI18next: { type: '3rdParty', init: vi.fn() }
}));

const buildStore = () => {
  return configureStore({
    reducer: {
      auth: authReducer,
      families: familyReducer,
      transactions: transactionReducer,
      wallets: walletReducer,
    },
    preloadedState: {
      auth: { user: { id: 'u1', name: 'Alice' } },
      families: { activeFamilyId: 'fam1', families: [] },
      wallets: {
        wallets: [
          { id: 'personal-wallet-1', user_id: 'u1', family_id: null, name: 'Alice Wallet' },
          { id: 'family-wallet-1', user_id: null, family_id: 'fam1', name: 'Family Fund' },
        ],
      },
    },
  });
};

const members = [
  { id: 'u1', name: 'Alice' },
  { id: 'u2', name: 'Bob' },
];

const baseProps = {
  isOpen: true,
  onClose: () => {},
  family: { id: 'fam1', members },
  onSubmit: () => {},
};

describe('SharedExpenseModal', () => {
  beforeEach(() => {
    mockApiPost.mockReset();
    mockToastError.mockReset();
    mockApiPost.mockResolvedValue({ data: { data: { id: 'tx1' } } });
  });
  it('splits evenly when chọn chia đều', async () => {
    const store = buildStore();
    render(<Provider store={store}><SharedExpenseModal {...baseProps} /></Provider>);

    fireEvent.change(screen.getByPlaceholderText('0'), { target: { value: '1000' } });

    await waitFor(() => expect(screen.getByText(/500/)).toBeTruthy());
  });

  it('asks for a personal wallet because the current member pays first', () => {
    const store = buildStore();
    render(<Provider store={store}><SharedExpenseModal {...baseProps} /></Provider>);

    expect(screen.getByText('sharedExpense.walletLabel')).toBeTruthy();
  });

  it('creates a personal-wallet expense with paid payer share and unpaid approved member shares', async () => {
    const store = buildStore();
    render(<Provider store={store}><SharedExpenseModal {...baseProps} /></Provider>);

    fireEvent.change(screen.getByLabelText('sharedExpense.descriptionLabel'), { target: { value: 'Dinner' } });
    fireEvent.change(screen.getByPlaceholderText('0'), { target: { value: '1000' } });
    fireEvent.click(screen.getByText('sharedExpense.submitBtn'));

    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith('/transactions', expect.objectContaining({
        wallet_id: 'personal-wallet-1',
        family_id: 'fam1',
        shares: [
          expect.objectContaining({
            user_id: 'u1',
            status: 'PAID',
            approval_status: 'APPROVED',
          }),
          expect.objectContaining({
            user_id: 'u2',
            status: 'UNPAID',
            approval_status: 'APPROVED',
          }),
        ],
      }));
    });
  });

  it('maps insufficient balance errors to localized toast text', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockApiPost.mockRejectedValueOnce({
      response: { data: { message: 'INSUFFICIENT_BALANCE' } },
    });
    const store = buildStore();
    render(<Provider store={store}><SharedExpenseModal {...baseProps} /></Provider>);

    fireEvent.change(screen.getByLabelText('sharedExpense.descriptionLabel'), { target: { value: 'Dinner' } });
    fireEvent.change(screen.getByPlaceholderText('0'), { target: { value: '1000' } });
    fireEvent.click(screen.getByText('sharedExpense.submitBtn'));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('errors.transactions.insufficientBalance');
    });
    consoleErrorSpy.mockRestore();
  });

  it.skip('supports percent split', () => {
  });
});
