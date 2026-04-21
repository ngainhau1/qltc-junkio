// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Family } from './Family'

const { mockDispatch, mockSettleDebts, mockFetchTransactions, mockSimplifyDebts, mockState } = vi.hoisted(() => ({
    mockDispatch: vi.fn(),
    mockSettleDebts: vi.fn((payload) => ({ type: 'transactions/settleDebts', payload })),
    mockFetchTransactions: vi.fn(() => ({ type: 'transactions/fetchTransactions' })),
    mockSimplifyDebts: vi.fn(() => []),
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

vi.mock('@/utils/debtSimplification', () => ({
    simplifyDebts: mockSimplifyDebts
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

describe('Family shared expense settlement flow', () => {
    beforeEach(() => {
        mockSettleDebts.mockClear()
        mockFetchTransactions.mockClear()
        mockSimplifyDebts.mockReset()
        mockSimplifyDebts.mockReturnValue([])
        mockDispatch.mockReset()
        mockDispatch.mockImplementation((action) => ({
            unwrap: () => Promise.resolve(
                action.type === 'transactions/fetchTransactions'
                    ? { transactions: [] }
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
                    { id: 'wallet-family-1', family_id: 'fam1' }
                ]
            },
            transactions: {
                transactions: [
                    {
                        id: 'tx1',
                        wallet_id: 'wallet-family-1',
                        type: 'EXPENSE',
                        user_id: 'u2',
                        amount: '100000',
                        description: 'Hotpot',
                        shares: [
                            {
                                id: 'share-approve-1',
                                user_id: 'u1',
                                amount: 50000,
                                status: 'UNPAID',
                                approval_status: 'PENDING'
                            }
                        ]
                    }
                ]
            }
        })
    })

    it('does not render pending debt actions', () => {
        render(<Family />)

        expect(screen.queryByText('family.pendingDebts.btnApprove')).toBeNull()
        expect(screen.queryByText('family.pendingDebts.btnReject')).toBeNull()
    })

    it('uses backend Shares alias and lets every member optimize legacy pending shares', async () => {
        mockState.transactions.transactions = [
            {
                id: 'tx-shares-alias',
                wallet_id: 'wallet-family-1',
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
                        approval_status: 'PENDING'
                    }
                ]
            }
        ]

        render(<Family />)
        fireEvent.click(screen.getByText('family.expenses.optimizeBtn'))

        await waitFor(() => {
            expect(mockSimplifyDebts).toHaveBeenCalledWith([
                expect.objectContaining({
                    id: 'tx-shares-alias',
                    shares: [expect.objectContaining({ id: 'share-alias-1' })]
                })
            ])
        })
    })

    it('hides shared expenses when all shares are paid', () => {
        mockState.transactions.transactions = [
            {
                id: 'tx-paid',
                wallet_id: 'wallet-family-1',
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

    it('shows optimized settlements to non-owners without the pay action', () => {
        mockSimplifyDebts.mockReturnValueOnce([{ from: 'u1', to: 'u2', amount: 50000 }])

        render(<Family />)

        fireEvent.click(screen.getByText('family.expenses.optimizeBtn'))

        expect(screen.getByText('family.settlement.debtor')).toBeTruthy()
        expect(screen.queryByText('family.settlement.payBtn')).toBeNull()
    })

    it('lets the family owner settle with from_user_id and recalculates from refreshed transactions', async () => {
        mockState.families.families[0].owner_id = 'u1'
        mockSimplifyDebts
            .mockReturnValueOnce([{ from: 'u1', to: 'u2', amount: 50000 }])
            .mockReturnValueOnce([])

        render(<Family />)

        fireEvent.click(screen.getByText('family.expenses.optimizeBtn'))
        fireEvent.click(screen.getByText('family.settlement.payBtn'))
        fireEvent.click(screen.getByText('family.modals.settle.submit'))

        await waitFor(() => {
            expect(mockSettleDebts).toHaveBeenCalledWith(expect.objectContaining({
                from_user_id: 'u1',
                to_user_id: 'u2',
                amount: 50000,
                family_id: 'fam1'
            }))
            expect(mockFetchTransactions).toHaveBeenCalled()
            expect(mockSimplifyDebts).toHaveBeenLastCalledWith([])
        })
    })
})
