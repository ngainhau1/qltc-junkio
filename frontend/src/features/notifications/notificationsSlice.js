import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/api';

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
            state.items.unshift(action.payload);
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
                state.items = action.payload; // Replace with server data
            })
            .addCase(fetchNotifications.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(markAllNotificationsRead.fulfilled, (state) => {
                state.items.forEach(n => { n.isRead = true; n.is_read = true; }); // Support both js snake and camel case if any
            })
            .addCase(markSingleNotificationRead.fulfilled, (state, action) => {
                const notification = state.items.find(n => n.id === action.payload.id);
                if (notification) {
                    notification.isRead = true;
                    notification.is_read = true;
                }
            });
    }
});

export const { addNotification, clearAll } = notificationsSlice.actions;

// Selectors
export const selectUnreadCount = (state) => state.notifications.items.filter(n => !n.isRead && !n.is_read).length;

export default notificationsSlice.reducer;
