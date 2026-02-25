import { createSlice } from '@reduxjs/toolkit';

// Generate some initial mock notifications
const generateMockNotifications = () => {
    return [
        {
            id: 'notif-1',
            type: 'BUDGET_ALERT',
            title: 'Cảnh báo Ngân sách',
            message: 'Bạn đã tiêu vượt quá 80% ngân sách tháng này cho danh mục "Ăn uống".',
            isRead: false,
            createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
            data: { category: 'Dining' }
        },
        {
            id: 'notif-2',
            type: 'DEBT_REMINDER',
            title: 'Nhắc nhở Nợ',
            message: 'Đừng quên bạn còn khoản nợ 500.000đ với Nguyễn Văn A.',
            isRead: false,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
            data: { debtorId: 'u-2' }
        },
        {
            id: 'notif-3',
            type: 'SYSTEM_UPDATE',
            title: 'Nâng cấp hệ thống',
            message: 'Junkio vừa cập nhật tính năng Quản lý Gia đình mới. Khám phá ngay!',
            isRead: true,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
            data: {}
        }
    ];
};

const initialState = {
    items: generateMockNotifications(),
};

const notificationsSlice = createSlice({
    name: 'notifications',
    initialState,
    reducers: {
        addNotification: (state, action) => {
            state.items.unshift({
                ...action.payload,
                id: `notif-${Date.now()}`,
                isRead: false,
                createdAt: new Date().toISOString()
            });
        },
        markAsRead: (state, action) => {
            const notification = state.items.find(n => n.id === action.payload);
            if (notification) {
                notification.isRead = true;
            }
        },
        markAllAsRead: (state) => {
            state.items.forEach(n => {
                n.isRead = true;
            });
        },
        clearAll: (state) => {
            state.items = [];
        }
    }
});

export const { addNotification, markAsRead, markAllAsRead, clearAll } = notificationsSlice.actions;

// Selectors
export const selectUnreadCount = (state) => state.notifications.items.filter(n => !n.isRead).length;

export default notificationsSlice.reducer;
