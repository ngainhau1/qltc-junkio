// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { TransactionDetailModal } from '@/components/features/transactions/TransactionDetailModal';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key, params) => (params?.wallet ? `${key}:${params.wallet}` : key)
    }),
    initReactI18next: { type: '3rdParty', init: vi.fn() }
}));

const renderDetail = ({ transaction, isDetailLoading = false, error = null, families = [] }) => {
    const store = configureStore({
        reducer: {
            transactions: () => ({
                selectedTransaction: transaction,
                isDetailLoading,
                error,
            }),
            families: () => ({
                families,
            }),
        },
    });

    return render(
        <Provider store={store}>
            <TransactionDetailModal isOpen={true} onClose={() => {}} />
        </Provider>
    );
};

describe('TransactionDetailModal', () => {
    it('shows transfer out as a negative red amount', async () => {
        renderDetail({
            transaction: {
                id: 'tx-1',
                type: 'TRANSFER_OUT',
                amount: 250000,
                description: 'Savings transfer',
                date: '2026-03-26',
                Wallet: { name: 'Cash' },
                Category: null,
            }
        });

        expect(screen.getByText('Savings transfer')).toBeTruthy();
        expect(screen.getByText('transactionForm.tabs.transfer')).toBeTruthy();
        const amount = screen.getByText((content) => content.startsWith('-') && content.includes('250'));
        expect(amount.className).toContain('text-red-600');
    });

    it('shows the normalized debt description returned by the API', async () => {
        renderDetail({
            transaction: {
                id: 'tx-2',
                type: 'TRANSFER_IN',
                amount: 2000000,
                description: 'Nhận tiền trả nợ từ Nguyen Van Demo',
                date: '2026-04-22',
                Wallet: { name: 'Bank Card' },
                Category: null,
            }
        });

        expect(screen.getByText('Nhận tiền trả nợ từ Nguyen Van Demo')).toBeTruthy();
    });

    it('shows lowercase shares and falls back to family member names', async () => {
        renderDetail({
            families: [{
                id: 'fam1',
                members: [{ id: 'u1', name: 'Alice' }]
            }],
            transaction: {
                id: 'tx-3',
                family_id: 'fam1',
                type: 'EXPENSE',
                amount: 100000,
                description: 'Shared meal',
                date: '2026-04-22',
                Wallet: { name: 'Bob Wallet' },
                Category: null,
                shares: [{
                    id: 'share-1',
                    user_id: 'u1',
                    amount: 50000,
                    status: 'UNPAID',
                    approval_status: 'APPROVED'
                }]
            }
        });

        expect(screen.getAllByText('Alice').length).toBeGreaterThan(0);
        expect(screen.getAllByText('transactions.detail.unpaid').length).toBeGreaterThan(0);
    });

    it('does not render a blank modal when detail loading fails', async () => {
        renderDetail({
            transaction: null,
            error: 'TRANSACTION_LOAD_FAILED'
        });

        expect(screen.getByText('transactions.detail.emptyTitle')).toBeTruthy();
        expect(screen.getByText('transactions.detail.loadFailed')).toBeTruthy();
    });
});
