// @vitest-environment jsdom
import { render, waitFor } from '@testing-library/react';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import notificationsReducer from '@/features/notifications/notificationsSlice';
import { useSocket } from '@/hooks/useSocket';

const { handlers, mockSocket, mockIo, toastMocks } = vi.hoisted(() => {
    const registeredHandlers = {};
    const socket = {
        on: vi.fn((event, handler) => {
            registeredHandlers[event] = handler;
        }),
        emit: vi.fn(),
        disconnect: vi.fn(),
    };

    return {
        handlers: registeredHandlers,
        mockSocket: socket,
        mockIo: vi.fn(() => socket),
        toastMocks: {
            error: vi.fn(),
            success: vi.fn(),
            info: vi.fn(),
        },
    };
});

vi.mock('socket.io-client', () => ({
    io: mockIo,
}));

vi.mock('sonner', () => ({
    toast: toastMocks,
}));

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (value) => value,
    }),
}));

function Harness() {
    useSocket();
    return <div>socket-ready</div>;
}

describe('useSocket', () => {
    beforeEach(() => {
        Object.keys(handlers).forEach((key) => delete handlers[key]);
        mockIo.mockClear();
        mockSocket.on.mockClear();
        mockSocket.emit.mockClear();
        mockSocket.disconnect.mockClear();
        toastMocks.error.mockClear();
        toastMocks.success.mockClear();
        toastMocks.info.mockClear();
    });

    it('joins the user room and dispatches NEW_NOTIFICATION events', async () => {
        const store = configureStore({
            reducer: {
                auth: () => ({
                    isAuthenticated: true,
                    user: { id: 'user-1' },
                }),
                notifications: notificationsReducer,
            },
        });

        render(
            <Provider store={store}>
                <Harness />
            </Provider>
        );

        await waitFor(() => {
            expect(mockIo).toHaveBeenCalledTimes(1);
        });

        handlers.connect();
        expect(mockSocket.emit).toHaveBeenCalledWith('join_user_room', 'user-1');

        handlers.NEW_NOTIFICATION({
            id: 'notif-1',
            type: 'BUDGET_WARNING',
            title: 'Warning',
            message: 'Budget warning',
            created_at: new Date().toISOString(),
            is_read: false,
        });

        expect(store.getState().notifications.items).toHaveLength(1);
        expect(store.getState().notifications.items[0].title).toBe('Warning');
        expect(toastMocks.info).toHaveBeenCalledWith('Warning: Budget warning');
    });
});
