import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { addNotification } from '@/features/notifications/notificationsSlice';
import { useTranslation } from 'react-i18next';
import { parseNotificationText } from '@/utils/notificationHelper';

const getSocketUrl = () => {
    const apiUrl = import.meta.env.VITE_API_URL || '/api';
    return apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl;
};

const showNotificationToast = (notification, t) => {
    if (!notification?.message) {
        return;
    }

    const titleMsg = parseNotificationText(notification.title, t);
    const bodyMsg = parseNotificationText(notification.message, t);
    const fullMessage = titleMsg && titleMsg !== bodyMsg ? `${titleMsg}: ${bodyMsg}` : bodyMsg;

    if (notification.type === 'BUDGET_EXCEEDED') {
        toast.error(fullMessage, { duration: 8000 });
        return;
    }

    if (notification.type === 'DEBT_SETTLED') {
        toast.success(fullMessage);
        return;
    }

    toast.info(fullMessage);
};

export function useSocket() {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
    const userId = useSelector((state) => state.auth.user?.id || null);

    useEffect(() => {
        if (!isAuthenticated || !userId) {
            return undefined;
        }

        let socket;
        let isCancelled = false;

        const connectSocket = async () => {
            const { io } = await import('socket.io-client');

            if (isCancelled) {
                return;
            }

            socket = io(getSocketUrl(), {
                withCredentials: true,
            });

            socket.on('connect', () => {
                socket.emit('join_user_room', userId);
            });

            socket.on('NEW_NOTIFICATION', (notification) => {
                dispatch(addNotification(notification));
                showNotificationToast(notification, t);
            });
        };

        connectSocket();

        return () => {
            isCancelled = true;
            if (socket) {
                socket.disconnect();
            }
        };
    }, [dispatch, isAuthenticated, userId, t]);
}
