// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Family } from './Family'

const { mockDispatch, mockApproveDebt, mockRejectDebt, mockState } = vi.hoisted(() => ({
    mockDispatch: vi.fn(),
    mockApproveDebt: vi.fn((shareId) => ({ type: 'transactions/approveDebt', payload: shareId })),
    mockRejectDebt: vi.fn((shareId) => ({ type: 'transactions/rejectDebt', payload: shareId })),
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
    simplifyDebts: vi.fn(() => [])
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
    approveDebt: mockApproveDebt,
    rejectDebt: mockRejectDebt,
    settleDebts: vi.fn(() => ({ type: 'transactions/settleDebts' })),
    fetchTransactions: vi.fn(() => ({ type: 'transactions/fetchTransactions' }))
}))

describe('Family pending debt actions', () => {
    beforeEach(() => {
        mockApproveDebt.mockClear()
        mockRejectDebt.mockClear()
        mockDispatch.mockReset()
        mockDispatch.mockImplementation(() => ({
            unwrap: () => Promise.resolve()
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

    it('dispatches approveDebt and rejectDebt with the share id', async () => {
        render(<Family />)

        fireEvent.click(screen.getByText('family.pendingDebts.btnApprove'))
        fireEvent.click(screen.getByText('family.pendingDebts.btnReject'))

        await waitFor(() => {
            expect(mockApproveDebt).toHaveBeenCalledWith('share-approve-1')
            expect(mockRejectDebt).toHaveBeenCalledWith('share-approve-1')
        })
    })
})
