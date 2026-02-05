import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import walletReducer from '../features/wallets/walletSlice';
import transactionReducer from '../features/transactions/transactionSlice';
import familyReducer from '../features/families/familySlice';
import recurringReducer from '../features/recurring/recurringSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        wallets: walletReducer,
        transactions: transactionReducer,
        families: familyReducer,
        recurring: recurringReducer,
    },
});
