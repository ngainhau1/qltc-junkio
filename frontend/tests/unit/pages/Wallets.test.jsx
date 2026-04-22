// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Wallets } from '@/pages/Wallets';

const { mockDispatch, mockState } = vi.hoisted(() => ({
    mockDispatch: vi.fn(),
    mockState: {}
}));

vi.mock('react-redux', () => ({
    useDispatch: () => mockDispatch,
    useSelector: (selector) => selector(mockState)
}));

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key, params) => (params?.name ? `${key}:${params.name}` : key)
    }),
    initReactI18next: { type: '3rdParty', init: vi.fn() }
}));

vi.mock('@/components/ui/button', () => ({
    Button: ({ children, ...props }) => <button {...props}>{children}</button>
}));

vi.mock('@/components/ui/card', () => ({
    Card: ({ children, ...props }) => <div {...props}>{children}</div>,
    CardHeader: ({ children, ...props }) => <div {...props}>{children}</div>,
    CardTitle: ({ children, ...props }) => <h2 {...props}>{children}</h2>,
    CardDescription: ({ children, ...props }) => <p {...props}>{children}</p>,
    CardContent: ({ children, ...props }) => <div {...props}>{children}</div>,
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
    DropdownMenu: ({ children }) => <div>{children}</div>,
    DropdownMenuContent: ({ children }) => <div>{children}</div>,
    DropdownMenuItem: ({ children, ...props }) => <button {...props}>{children}</button>,
    DropdownMenuTrigger: ({ children }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/modal', () => ({
    Modal: ({ isOpen, children }) => (isOpen ? <div>{children}</div> : null)
}));

vi.mock('@/components/features/wallets/WalletForm', () => ({
    WalletForm: () => null
}));

vi.mock('@/components/ui/empty-state', () => ({
    EmptyState: ({ title, description }) => (
        <div>
            <div>{title}</div>
            <div>{description}</div>
        </div>
    )
}));

vi.mock('@/components/layout/PageHeader', () => ({
    PageHeader: ({ title, description, actions }) => (
        <div>
            <h1>{title}</h1>
            <p>{description}</p>
            {actions}
        </div>
    )
}));

vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn()
    }
}));

describe('Wallets page scope selector', () => {
    beforeEach(() => {
        mockDispatch.mockClear();
        Object.assign(mockState, {
            wallets: {
                wallets: [
                    { id: 'personal-wallet', name: 'Personal Wallet', balance: 1000, type: 'cash', family_id: null },
                    { id: 'family-wallet', name: 'Family Wallet', balance: 2000, type: 'bank', family_id: 'fam1' }
                ]
            },
            families: {
                activeFamilyId: null,
                families: [{ id: 'fam1', name: 'Demo Family' }]
            }
        });
    });

    it('uses the scope button to switch from personal wallets to a family scope', () => {
        render(<Wallets />);

        expect(screen.getByText('Personal Wallet')).toBeTruthy();
        expect(screen.queryByText('Family Wallet')).toBeNull();

        fireEvent.click(screen.getByText('common.familyNamed:Demo Family'));

        expect(mockDispatch).toHaveBeenCalledWith({
            type: 'families/setActiveFamily',
            payload: 'fam1'
        });
    });

    it('shows family wallets when a family scope is active', () => {
        mockState.families.activeFamilyId = 'fam1';

        render(<Wallets />);

        expect(screen.getByText('Family Wallet')).toBeTruthy();
        expect(screen.queryByText('Personal Wallet')).toBeNull();
    });
});
