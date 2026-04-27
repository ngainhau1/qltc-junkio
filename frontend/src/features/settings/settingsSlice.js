import { createSlice } from '@reduxjs/toolkit';
import i18n from '@/lib/i18n';

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
    currency: 'VND',
    language: 'vi',
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
            i18n.changeLanguage(action.payload);
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
