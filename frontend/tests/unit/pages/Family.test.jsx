// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Family } from '@/pages/Family'
import { setActiveFamily } from '@/features/families/familySlice'

const { mockDispatch, mockSettleDebts, mockFetchTransactions, mockFetchWallets, mockState } = vi.hoisted(() => ({
    mockDispatch: vi.fn(),
    mockSettleDebts: vi.fn((payload) => ({ type: 'transactions/settleDebts', payload })),
    mockFetchTransactions: vi.fn(() => ({ type: 'transactions/fetchTransactions' })),
    mockFetchWallets: vi.fn(() => ({ type: 'wallets/fetchWallets' })),
    mockState: {}
}))

vi.mock('react-redux', () => ({
    useDispatch: () => mockDispatch,
    useSelector: (selector) => selector(mockState)
}))

vi.mock('@/components/ui/button', () => ({
    Button: ({ children, ...props }) => <button {...props}>{children}</button>
}))

vi.mock('@/components/ui/card', () => ({
    Card: ({ children, ...props }) => <div {...props}>{children}</div>,
    CardHeader: ({ children, ...props }) => <div {...props}>{children}</div>,
    CardTitle: ({ children, ...props }) => <h2 {...props}>{children}</h2>,
    CardDescription: ({ children, ...props }) => <p {...props}>{children}</p>,
    CardContent: ({ children, ...props }) => <div {...props}>{children}</div>
}))

vi.mock('@/components/ui/input', () => ({
    Input: (props) => <input {...props} />
}))

vi.mock('@/components/ui/modal', () => ({
    Modal: ({ isOpen, children }) => isOpen ? <div>{children}</div> : null
}))

vi.mock('@/components/ui/dropdown-menu', () => ({
    DropdownMenu: ({ children }) => <div>{children}</div>,
    DropdownMenuContent: ({ children }) => <div>{children}</div>,
    DropdownMenuItem: ({ children, ...props }) => <button {...props}>{children}</button>,
    DropdownMenuLabel: ({ children }) => <div>{children}</div>,
    DropdownMenuSeparator: () => <hr />,
    DropdownMenuTrigger: ({ children }) => <div>{children}</div>
}))

vi.mock('@/components/ui/select', () => ({
    Select: ({ children, value, onValueChange }) => (
        <select value={value} onChange={(event) => onValueChange(event.target.value)}>
            {children}
        </select>
    ),
    SelectContent: ({ children }) => <>{children}</>,
    SelectItem: ({ children, value }) => <option value={value}>{children}</option>,
    SelectTrigger: ({ children }) => <>{children}</>,
    SelectValue: () => null
}))

vi.mock('@/components/ui/empty-state', () => ({
    EmptyState: ({ title, description }) => (
        <div>
            <div>{title}</div>
            <div>{description}</div>
        </div>
    )
}))

vi.mock('@/components/features/families/SharedExpenseModal', () => ({
    SharedExpenseModal: () => null
}))

vi.mock('@/components/layout/PageHeader', () => ({
    PageHeader: ({ title, description, actions }) => (
        <div>
            <h1>{title}</h1>
            <p>{description}</p>
            {actions}
        </div>
    )
}))

vi.mock('@/lib/utils', () => ({
    formatCurrency: (amount) => String(amount)
}))

vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        info: vi.fn()
    }
}))

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key) => key
    }),
    initReactI18next: { type: '3rdParty', init: vi.fn() }
}))

vi.mock('@/features/families/familySlice', () => ({
    createFamily: vi.fn(() => ({ type: 'families/createFamily' })),
    fetchFamilies: vi.fn(() => ({ type: 'families/fetchFamilies' })),
    setActiveFamily: vi.fn((id) => ({ type: 'families/setActiveFamily', payload: id })),
    removeMemberFromFamily: vi.fn(() => ({ type: 'families/removeMember' }))
}))

vi.mock('@/features/transactions/transactionSlice', () => ({
    settleDebts: mockSettleDebts,
    fetchTransactions: mockFetchTransactions
}))

vi.mock('@/features/wallets/walletSlice', () => ({
    fetchWallets: mockFetchWallets
}))

describe('Family shared expense settlement flow', () => {
    beforeEach(() => {
        mockSettleDebts.mockClear()
        mockFetchTransactions.mockClear()
        mockFetchWallets.mockClear()
        setActiveFamily.mockClear()
        mockDispatch.mockReset()
        mockDispatch.mockImplementation((action) => ({
            unwrap: () => Promise.resolve(
                action.type === 'transactions/fetchTransactions'
                    ? { transactions: [] }
                    : action.type === 'wallets/fetchWallets'
                        ? []
                        : undefined
            )
        }))

        Object.assign(mockState, {
            auth: { user: { id: 'u1', name: 'Alice' } },
            families: {
                activeFamilyId: 'fam1',
                families: [
                    {
                        id: 'fam1',
                        owner_id: 'owner-id',
                        members: [
                            { id: 'u1', name: 'Alice', role: 'MEMBER' },
                            { id: 'u2', name: 'Bob', role: 'MEMBER' }
                        ]
                    }
                ]
            },
            wallets: {
                wallets: [
                    { id: 'wallet-u1-personal', user_id: 'u1', family_id: null, name: 'Alice Wallet' },
                    { id: 'wallet-u2-personal', user_id: 'u2', family_id: null, name: 'Bob Wallet' },
                    { id: 'wallet-family-1', family_id: 'fam1', name: 'Family Fund' }
                ]
            },
            transactions: {
                transactions: [
                    {
                        id: 'tx1',
                        wallet_id: 'wallet-u2-personal',
                        family_id: 'fam1',
                        type: 'EXPENSE',
                        user_id: 'u2',
                        amount: '100000',
                        description: 'Hotpot',
                        shares: [
                            {
                                id: 'share-payer-1',
                                user_id: 'u2',
                                amount: 50000,
                                status: 'PAID',
                                approval_status: 'APPROVED'
                            },
                            {
                                id: 'share-approve-1',
                                user_id: 'u1',
                                amount: 50000,
                                status: 'UNPAID',
                                approval_status: 'APPROVED'
                            }
                        ]
                    }
                ]
            }
        })
    })

    it('uses backend Shares alias and lets every member optimize approved shares to the payer', async () => {
        mockState.transactions.transactions = [
            {
                id: 'tx-shares-alias',
                wallet_id: 'wallet-u2-personal',
                family_id: 'fam1',
                type: 'EXPENSE',
                user_id: 'u2',
                amount: '100000',
                description: 'Alias hotpot',
                Shares: [
                    {
                        id: 'share-alias-1',
                        user_id: 'u1',
                        amount: 50000,
                        status: 'UNPAID',
                        approval_status: 'APPROVED'
                    }
                ]
            }
        ]

        render(<Family />)
        fireEvent.click(screen.getByText('family.expenses.optimizeBtn'))

        expect(screen.getByText('family.settlement.debtor')).toBeTruthy()
        expect(screen.getAllByText('Bob').length).toBeGreaterThan(0)
    })

    it('hides shared expenses when all shares are paid', () => {
        mockState.transactions.transactions = [
            {
                id: 'tx-paid',
                wallet_id: 'wallet-u2-personal',
                family_id: 'fam1',
                type: 'EXPENSE',
                user_id: 'u2',
                amount: '100000',
                description: 'Paid dinner',
                Shares: [
                    {
                        id: 'share-paid-1',
                        user_id: 'u1',
                        amount: 50000,
                        status: 'PAID',
                        approval_status: 'APPROVED'
                    },
                    {
                        id: 'share-paid-2',
                        user_id: 'u2',
                        amount: 50000,
                        status: 'PAID',
                        approval_status: 'APPROVED'
                    }
                ]
            }
        ]

        render(<Family />)

        expect(screen.queryByText('Paid dinner')).toBeNull()
    })

    it('does not optimize family fund expenses without debt shares', () => {
        mockState.transactions.transactions = [
            {
                id: 'tx-family-fund',
                wallet_id: 'wallet-family-1',
                family_id: 'fam1',
                type: 'EXPENSE',
                user_id: 'owner-id',
                amount: '100000',
                description: 'Family groceries'
            }
        ]

        render(<Family />)

        expect(screen.queryByText('Family groceries')).toBeNull()
        expect(screen.getByText('family.expenses.optimizeBtn').disabled).toBe(true)
    })

    it('keeps the active family selected when the active switch button is clicked again', () => {
        render(<Family />)

        fireEvent.click(screen.getByTestId('family-switch-button'))

        expect(setActiveFamily).toHaveBeenCalledWith('fam1')
        expect(setActiveFamily).not.toHaveBeenCalledWith(null)
        expect(mockDispatch).toHaveBeenCalledWith({
            type: 'families/setActiveFamily',
            payload: 'fam1'
        })
    })

    it('shows optimized settlements to owners without pay action when they are not the debtor', () => {
        mockState.auth.user = { id: 'owner-id', name: 'Owner' }
        render(<Family />)

        fireEvent.click(screen.getByText('family.expenses.optimizeBtn'))

        expect(screen.getByText('family.settlement.debtor')).toBeTruthy()
        expect(screen.queryByText('family.settlement.payBtn')).toBeNull()
    })

    it('lets the debtor settle with personal wallet and refresh transactions plus wallets', async () => {
        render(<Family />)

        fireEvent.click(screen.getByText('family.expenses.optimizeBtn'))
        fireEvent.click(screen.getByText('family.settlement.payBtn'))
        fireEvent.click(screen.getByText('family.modals.settle.submit'))

        await waitFor(() => {
            expect(mockSettleDebts).toHaveBeenCalledWith(expect.objectContaining({
                to_user_id: 'u2',
                amount: 50000,
                from_wallet_id: 'wallet-u1-personal',
                family_id: 'fam1'
            }))
            expect(mockSettleDebts.mock.calls[0][0]).not.toHaveProperty('to_wallet_id')
            expect(mockSettleDebts.mock.calls[0][0]).not.toHaveProperty('from_user_id')
            expect(mockFetchTransactions).toHaveBeenCalled()
            expect(mockFetchWallets).toHaveBeenCalled()
        })
    })
})
