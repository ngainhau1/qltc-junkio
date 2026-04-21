// @vitest-environment jsdom
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SharedExpenseModal } from './SharedExpenseModal';
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

// Mock UI components to avoid portal/radix complexity
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
  Select: ({ children, onValueChange, value }) => (
    <select value={value} onChange={(e) => onValueChange(e.target.value)} data-testid="select">{children}</select>
  ),
  SelectContent: ({ children }) => <>{children}</>,
  SelectTrigger: ({ children }) => <>{children}</>,
  SelectValue: () => null,
  SelectItem: ({ value, children }) => <option value={value}>{children}</option>,
}));

// Mock translation
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
      wallets: { wallets: [] },
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
  familyWalletId: 'w1',
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

    // Each member should show 500
    await waitFor(() => expect(screen.getByText(/500/)).toBeTruthy());
  });

  it('creates approved shares for non-payers', async () => {
    const store = buildStore();
    render(<Provider store={store}><SharedExpenseModal {...baseProps} /></Provider>);

    fireEvent.change(screen.getByLabelText('sharedExpense.descriptionLabel'), { target: { value: 'Dinner' } });
    fireEvent.change(screen.getByPlaceholderText('0'), { target: { value: '1000' } });
    fireEvent.click(screen.getByText('sharedExpense.submitBtn'));

    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith('/transactions', expect.objectContaining({
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
    // UI hiện tại chưa có lựa chọn chia theo %, cần triển khai trước khi test.
  });
});
