import { createSlice } from '@reduxjs/toolkit';

// Khởi tạo state từ localStorage nếu có, nếu không thì dùng mặc định
const loadPreloadedState = () => {
    try {
        const serializedState = localStorage.getItem('app_settings');
        if (serializedState === null) {
            return undefined;
        }
        return JSON.parse(serializedState);
    } catch {
        return undefined;
    }
};

const defaultState = {
    currency: 'VND', // 'VND', 'USD', 'EUR'
    language: 'vi', // 'vi', 'en'
    notifications: {
        budgetAlerts: true,
        debtReminders: true,
        weeklyReports: false
    }
};

const initialState = loadPreloadedState() || defaultState;

const settingsSlice = createSlice({
    name: 'settings',
    initialState,
    reducers: {
        updateCurrency: (state, action) => {
            state.currency = action.payload;
            localStorage.setItem('app_settings', JSON.stringify(state));
        },
        updateLanguage: (state, action) => {
            state.language = action.payload;
            localStorage.setItem('app_settings', JSON.stringify(state));
        },
        toggleNotification: (state, action) => {
            const { key, value } = action.payload;
            if (state.notifications[key] !== undefined) {
                state.notifications[key] = value;
                localStorage.setItem('app_settings', JSON.stringify(state));
            }
        },
        resetSettings: () => {
            localStorage.removeItem('app_settings');
            return defaultState;
        }
    },
});

export const { updateCurrency, updateLanguage, toggleNotification, resetSettings } = settingsSlice.actions;
export default settingsSlice.reducer;
