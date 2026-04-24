// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { TransactionForm } from '@/components/features/transactions/TransactionForm'
import walletReducer from '@/features/wallets/walletSlice'
import transactionReducer from '@/features/transactions/transactionSlice'
import familyReducer from '@/features/families/familySlice'

// Mock Tabs to avoid Radix UI issues in JSDOM
vi.mock('@/components/ui/tabs', () => ({
    Tabs: ({ onValueChange, children }) => {
        return (
            <div>
                <div className="mock-tabs-controls">
                    <button data-testid="tab-expense" onClick={() => onValueChange('EXPENSE')}>Mock Expense</button>
                    <button data-testid="tab-transfer" onClick={() => onValueChange('TRANSFER')}>Mock Transfer</button>
                </div>
                {children}
            </div>
        )
    },
    TabsList: ({ children }) => <div>{children}</div>,
    TabsTrigger: ({ children }) => <div>{children}</div>,
    TabsContent: () => null,
}))

vi.mock('@/features/categories/categorySlice', async (importOriginal) => {
    const actual = await importOriginal()
    return {
        ...actual,
        fetchCategories: vi.fn(() => ({ type: 'categories/fetchAll/mock' })),
    }
})

// Mock ResizeObserver for Radix UI (still good to have)
beforeAll(() => {
    global.ResizeObserver = class ResizeObserver {
        observe() { }
        unobserve() { }
        disconnect() { }
    }
    // Mock scrollIntoView for Radix UI or others
    window.HTMLElement.prototype.scrollIntoView = vi.fn()
    window.HTMLElement.prototype.hasPointerCapture = vi.fn()
    window.HTMLElement.prototype.releasePointerCapture = vi.fn()
})

// Mock store setup
const createMockStore = (preloadedState) => {
    return configureStore({
        reducer: {
            wallets: walletReducer,
            transactions: transactionReducer,
            families: familyReducer
        },
        preloadedState
    })
}

const mockWallets = [
    { id: 'w1', name: 'Wallet A', balance: 1000 },
    { id: 'w2', name: 'Wallet B', balance: 500 }
]

describe('TransactionForm Transfer Feature', () => {
    it('shows translated submit errors instead of raw backend codes', async () => {
        const store = createMockStore({ wallets: { wallets: mockWallets }, families: { activeFamilyId: null, families: [] } })
        store.dispatch = vi.fn((action) => {
            if (typeof action === 'function') {
                return {
                    unwrap: () => Promise.reject('TRANSACTION_CREATE_FAILED')
                }
            }

            return action
        })

        const { container } = render(
            <Provider store={store}>
                <TransactionForm />
            </Provider>
        )

        fireEvent.change(container.querySelector('#transaction-amount'), { target: { value: '50000' } })
        fireEvent.change(container.querySelector('#transaction-description'), { target: { value: 'Lunch' } })
        fireEvent.submit(screen.getByTestId('form-EXPENSE'))

        await waitFor(() => {
            const visibleErrors = Array.from(container.querySelectorAll('.text-red-500'))
                .map((node) => node.textContent)
                .filter(Boolean)

            expect(visibleErrors.length).toBeGreaterThan(0)
            expect(screen.queryByText('TRANSACTION_CREATE_FAILED')).toBeNull()
            expect(visibleErrors).not.toContain('TRANSACTION_CREATE_FAILED')
        })
    })

    it('should switch to Transfer mode and show correct fields', async () => {
        const store = createMockStore({ wallets: { wallets: mockWallets }, families: { activeFamilyId: null, families: [] } })
        render(
            <Provider store={store}>
                <TransactionForm />
            </Provider>
        )

        // Default: Expense
        expect(screen.getByTestId('form-EXPENSE')).toBeTruthy()

        // Switch to Transfer using Mock
        fireEvent.click(screen.getByTestId('tab-transfer'))

        // Check if form type changed
        await waitFor(() => {
            expect(screen.getByTestId('form-TRANSFER')).toBeTruthy()
        })

        // Check fields
        expect(screen.getByText('Từ Ví')).toBeTruthy()
        expect(screen.getByText('Đến Ví')).toBeTruthy()
        expect(screen.queryByText('Danh Mục')).toBeNull()
        expect(screen.getByText('Xác Nhận Chuyển')).toBeTruthy()
    })

    it.skip('should dispatch correct actions on valid Transfer', async () => {
        const store = createMockStore({ wallets: { wallets: mockWallets }, families: { activeFamilyId: null, families: [] } })
        store.dispatch = vi.fn((action) => {
            console.log('Action Dispatched:', JSON.stringify(action, null, 2))
        })

        render(
            <Provider store={store}>
                <TransactionForm />
            </Provider>
        )

        // Switch to Transfer
        fireEvent.click(screen.getByTestId('tab-transfer'))

        // Fill Data
        // Description
        const descInput = screen.getByPlaceholderText('vd: Chuyển tiền tiết kiệm')
        fireEvent.change(descInput, { target: { value: 'Transfer Test' } })

        // Amount
        const amountInput = screen.getByPlaceholderText('0')
        fireEvent.change(amountInput, { target: { value: '200' } })

        // Select Source Wallet (Explicitly)
        const sourceSelect = screen.getByTestId('source-wallet-select')
        fireEvent.change(sourceSelect, { target: { value: 'w1' } })

        // Select Dest Wallet to w2
        const destSelect = screen.getByTestId('dest-wallet-select')
        fireEvent.change(destSelect, { target: { value: 'w2' } })

        // Verify values before submit
        expect(amountInput).toHaveValue(200) // Input type number might be string '200' or number 200
        expect(sourceSelect).toHaveValue('w1')
        expect(destSelect).toHaveValue('w2')

        // Submit
        const submitBtn = screen.getByText('Xác Nhận Chuyển')
        fireEvent.click(submitBtn)

        await waitFor(() => {
            expect(store.dispatch).toHaveBeenCalledTimes(3)
        })

        // Check calls
        // 1. addTransaction
        expect(store.dispatch).toHaveBeenCalledWith(expect.objectContaining({
            type: 'transactions/addTransaction',
            payload: expect.objectContaining({
                type: 'TRANSFER',
                amount: 200,
                wallet_id: 'w1',
                destination_wallet_id: 'w2'
            })
        }))

        // 2. decreaseBalance (Source)
        expect(store.dispatch).toHaveBeenCalledWith(expect.objectContaining({
            type: 'wallets/decreaseBalance',
            payload: { id: 'w1', amount: 200 }
        }))

        // 3. increaseBalance (Destination)
        expect(store.dispatch).toHaveBeenCalledWith(expect.objectContaining({
            type: 'wallets/increaseBalance',
            payload: { id: 'w2', amount: 200 }
        }))
    })
})
