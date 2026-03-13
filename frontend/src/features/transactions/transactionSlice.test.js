import { describe, it, expect } from 'vitest';
import reducer, { setFilter } from './transactionSlice';

const baseState = {
  transactions: [],
  loading: false,
  error: null,
  filter: { startDate: null, endDate: null, categoryId: null, walletId: null },
  pagination: { currentPage: 1, itemsPerPage: 50 }
};

describe('transactionSlice reducers', () => {
  it('setFilter merges filter fields', () => {
    const next = reducer(baseState, setFilter({ startDate: '2026-01-01', walletId: 'w1' }));
    expect(next.filter.startDate).toBe('2026-01-01');
    expect(next.filter.walletId).toBe('w1');
    expect(next.filter.categoryId).toBeNull();
  });

  it('createTransaction.fulfilled prepends transaction', () => {
    const action = { type: 'transactions/createTransaction/fulfilled', payload: { id: 't1', amount: 10 } };
    const next = reducer(baseState, action);
    expect(next.transactions[0]).toEqual({ id: 't1', amount: 10 });
  });

  it('approveDebt.fulfilled updates share status', () => {
    const state = {
      ...baseState,
      transactions: [{ id: 'tx', shares: [{ id: 's1', approval_status: 'PENDING' }] }]
    };
    const action = { type: 'transactions/approveDebt/fulfilled', payload: { shareId: 's1' } };
    const next = reducer(state, action);
    expect(next.transactions[0].shares[0].approval_status).toBe('APPROVED');
  });
});
