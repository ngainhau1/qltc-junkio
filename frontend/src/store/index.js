import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import walletReducer from '../features/wallets/walletSlice';
import transactionReducer from '../features/transactions/transactionSlice';
import familyReducer from '../features/families/familySlice';
import recurringReducer from '../features/recurring/recurringSlice';
import uiReducer from '../features/ui/uiSlice';
import notificationsReducer from '../features/notifications/notificationsSlice';
import goalsReducer from '../features/goals/goalsSlice';
import settingsReducer from '../features/settings/settingsSlice';
import categoryReducer from '../features/categories/categorySlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        wallets: walletReducer,
        transactions: transactionReducer,
        families: familyReducer,
        recurring: recurringReducer,
        ui: uiReducer,
        notifications: notificationsReducer,
        goals: goalsReducer,
        settings: settingsReducer,
        categories: categoryReducer,
    },
});
