// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SharedExpenseModal } from './SharedExpenseModal';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import authReducer from '@/features/auth/authSlice';
import familyReducer from '@/features/families/familySlice';
import transactionReducer from '@/features/transactions/transactionSlice';
import walletReducer from '@/features/wallets/walletSlice';

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
  it('splits evenly when chọn chia đều', () => {
    const store = buildStore();
    render(<Provider store={store}><SharedExpenseModal {...baseProps} /></Provider>);

    fireEvent.change(screen.getByPlaceholderText('0'), { target: { value: '1000' } });

    // Each member should show 500
    expect(screen.getByText(/500/)).toBeTruthy();
  });

  it.skip('supports percent split', () => {
    // UI hiện tại chưa có lựa chọn chia theo %, cần triển khai trước khi test.
  });
});
