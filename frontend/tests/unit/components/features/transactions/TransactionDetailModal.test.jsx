// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { TransactionDetailModal } from '@/components/features/transactions/TransactionDetailModal';

describe('TransactionDetailModal', () => {
    it('shows a transfer label for transfer transactions', async () => {
        const store = configureStore({
            reducer: {
                transactions: () => ({
                    selectedTransaction: {
                        id: 'tx-1',
                        type: 'TRANSFER_OUT',
                        amount: 250000,
                        description: 'Savings transfer',
                        date: '2026-03-26',
                        Wallet: { name: 'Cash' },
                        Category: null,
                    },
                    isDetailLoading: false,
                }),
            },
        });

        render(
            <Provider store={store}>
                <TransactionDetailModal isOpen={true} onClose={() => {}} />
            </Provider>
        );

        expect(screen.getByText('Savings transfer')).toBeTruthy();
        expect(screen.getByText('Chuyển Khoản')).toBeTruthy();
    });
});
