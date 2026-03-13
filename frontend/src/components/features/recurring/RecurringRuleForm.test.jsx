// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { RecurringRuleForm } from './RecurringRuleForm';
import recurringReducer from '@/features/recurring/recurringSlice';
import walletReducer from '@/features/wallets/walletSlice';
import familyReducer from '@/features/families/familySlice';

// Mock action creator to observe dispatch payload
vi.mock('@/features/recurring/recurringSlice', async () => {
  const original = await vi.importActual('@/features/recurring/recurringSlice');
  return {
    ...original,
    createRecurring: vi.fn((payload) => ({ type: 'recurring/createRecurring', payload })),
  };
});

// Simplify i18n labels to raw keys
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (k, opts) => (opts?.amount ? String(opts.amount) : k),
    i18n: { language: 'vi', changeLanguage: () => {} },
  }),
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}));

const renderForm = () => {
  const store = configureStore({
    reducer: {
      recurring: recurringReducer,
      wallets: walletReducer,
      families: familyReducer,
    },
    preloadedState: {
      wallets: { wallets: [{ id: 'w1', name: 'Wallet 1', family_id: null }] },
      families: { activeFamilyId: null, families: [] },
    },
  });
  store.dispatch = vi.fn();

  render(
    <Provider store={store}>
      <RecurringRuleForm />
    </Provider>
  );

  return store;
};

describe('RecurringRuleForm', () => {
  it('shows fields based on frequency selection', () => {
    renderForm();
    expect(screen.getAllByPlaceholderText('0')[0]).toBeTruthy();

    // default DAILY -> no weekday select
    expect(screen.queryByTestId('weekday-select')).toBeNull();

    // choose weekly
    fireEvent.change(screen.getByLabelText('transactions.recurring.form.frequency'), { target: { value: 'WEEKLY' } });
    expect(screen.getByTestId('weekday-select')).toBeTruthy();
  });

  it('dispatches createRecurring with correct payload', () => {
    const store = renderForm();

    fireEvent.change(screen.getAllByPlaceholderText('transactions.recurring.form.namePlaceholder')[0], { target: { value: 'Netflix' } });
    fireEvent.change(screen.getAllByPlaceholderText('0')[0], { target: { value: '150000' } });
    fireEvent.change(screen.getByLabelText('transactions.recurring.form.frequency'), { target: { value: 'MONTHLY' } });

    fireEvent.click(screen.getByText('transactions.recurring.form.createBtn'));

    expect(store.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'recurring/createRecurring',
        payload: expect.objectContaining({
          name: 'Netflix',
          amount: '150000',
          frequency: 'MONTHLY',
        }),
      })
    );
  });
});
