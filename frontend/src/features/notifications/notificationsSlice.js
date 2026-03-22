import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/api';

const normalizeNotification = (notification) => {
    const isRead = Boolean(notification?.isRead ?? notification?.is_read);
    const createdAt = notification?.createdAt || notification?.created_at || new Date().toISOString();

    return {
        ...notification,
        title: notification?.title || notification?.type || 'Notification',
        createdAt,
        created_at: createdAt,
        isRead,
        is_read: isRead,
    };
};

const initialState = {
    items: [],
    loading: false,
    error: null,
};

export const fetchNotifications = createAsyncThunk(
    'notifications/fetchNotifications',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/notifications');
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.msg || 'Lỗi khi tải thông báo');
        }
    }
);

export const markAllNotificationsRead = createAsyncThunk(
    'notifications/markAllNotificationsRead',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.put('/notifications/read-all');
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.msg || 'Lỗi cập nhật');
        }
    }
);

export const markSingleNotificationRead = createAsyncThunk(
    'notifications/markSingleNotificationRead',
    async (id, { rejectWithValue }) => {
        try {
            const response = await api.put(`/notifications/${id}/read`);
            return { id, ...response.data };
        } catch (error) {
            return rejectWithValue(error.response?.data?.msg || 'Lỗi cập nhật');
        }
    }
);

const notificationsSlice = createSlice({
    name: 'notifications',
    initialState,
    reducers: {
        addNotification: (state, action) => {
            state.items.unshift(normalizeNotification(action.payload));
        },
        clearAll: (state) => {
            state.items = [];
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchNotifications.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchNotifications.fulfilled, (state, action) => {
                state.loading = false;
                state.items = Array.isArray(action.payload)
                    ? action.payload.map(normalizeNotification)
                    : [];
            })
            .addCase(fetchNotifications.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(markAllNotificationsRead.fulfilled, (state) => {
                state.items.forEach((notification) => {
                    notification.isRead = true;
                    notification.is_read = true;
                });
            })
            .addCase(markSingleNotificationRead.fulfilled, (state, action) => {
                const notification = state.items.find((item) => item.id === action.payload.id);
                if (notification) {
                    notification.isRead = true;
                    notification.is_read = true;
                }
            });
    }
});

export const { addNotification, clearAll } = notificationsSlice.actions;

// Selectors
export const selectUnreadCount = (state) =>
    state.notifications.items.filter((notification) => !notification.isRead).length;

export default notificationsSlice.reducer;
