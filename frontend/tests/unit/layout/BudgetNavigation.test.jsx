import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileMenu } from '@/pages/MobileMenu';

const { mockState, mockDispatch } = vi.hoisted(() => ({
    mockState: {},
    mockDispatch: vi.fn(),
}));

vi.mock('react-redux', () => ({
    useDispatch: () => mockDispatch,
    useSelector: (selector) => selector(mockState),
}));

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key, params) => params?.version ? `${key}:${params.version}` : key,
    }),
    initReactI18next: { type: '3rdParty', init: vi.fn() },
}));

vi.mock('@/features/auth/authSlice', () => ({
    default: () => ({
        user: null,
        token: null,
        isAuthenticated: false,
    }),
    logout: () => ({ type: 'auth/logout' }),
}));

vi.mock('@/components/ui/button', () => ({
    Button: ({ children, asChild = false, ...props }) => {
        if (asChild) {
            return children;
        }
        return <button {...props}>{children}</button>;
    },
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
    DropdownMenu: ({ children }) => <div>{children}</div>,
    DropdownMenuTrigger: ({ children }) => <div>{children}</div>,
    DropdownMenuContent: ({ children }) => <div>{children}</div>,
    DropdownMenuItem: ({ children, ...props }) => <button {...props}>{children}</button>,
}));

vi.mock('@/components/ui/modal', () => ({
    Modal: ({ isOpen, children }) => (isOpen ? <div>{children}</div> : null),
}));

describe('Budget navigation smoke', () => {
    it('shows the budgets link in the sidebar and mobile menu', () => {
        Object.assign(mockState, {
            auth: {
                user: { name: 'Demo User', email: 'demo@example.com', role: 'user' },
            },
            families: {
                families: [{ id: 'fam-1', name: 'Demo Family' }],
                activeFamilyId: null,
            },
        });

        render(
            <MemoryRouter>
                <Sidebar />
                <MobileMenu />
            </MemoryRouter>
        );

        expect(screen.getAllByText('nav.budgets')).toHaveLength(2);
    });
});
