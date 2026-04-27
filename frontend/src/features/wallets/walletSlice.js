import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/api';

const initialState = {
    wallets: [],
    loading: false,
    error: null,
};

export const fetchWallets = createAsyncThunk(
    'wallets/fetchWallets',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/wallets');
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'WALLET_LOAD_FAILED');
        }
    }
);

export const createWallet = createAsyncThunk(
    'wallets/createWallet',
    async (walletData, { rejectWithValue }) => {
        try {
            const response = await api.post('/wallets', walletData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'WALLET_CREATE_FAILED');
        }
    }
);

export const editWallet = createAsyncThunk(
    'wallets/editWallet',
    async ({ id, data }, { rejectWithValue }) => {
        try {
            const response = await api.put(`/wallets/${id}`, data);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'WALLET_UPDATE_FAILED');
        }
    }
);

export const removeWallet = createAsyncThunk(
    'wallets/removeWallet',
    async (id, { rejectWithValue }) => {
        try {
            await api.delete(`/wallets/${id}`);
            return id;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'WALLET_DELETE_FAILED');
        }
    }
);

const walletSlice = createSlice({
    name: 'wallets',
    initialState,
    reducers: {
        updateWalletBalanceLocal: (state, action) => {
            const { id, amount, type } = action.payload;
            const wallet = state.wallets.find(w => w.id === id);
            if (wallet) {
                const currentBalance = Number(wallet.balance);
                const changeAmount = Number(amount);
                wallet.balance = type === 'EXPENSE'
                    ? currentBalance - changeAmount
                    : currentBalance + changeAmount;
            }
        },
        increaseBalanceLocal: (state, action) => {
            const { id, amount } = action.payload;
            const wallet = state.wallets.find(w => w.id === id);
            if (wallet) {
                wallet.balance = Number(wallet.balance) + Number(amount);
            }
        },
        decreaseBalanceLocal: (state, action) => {
            const { id, amount } = action.payload;
            const wallet = state.wallets.find(w => w.id === id);
            if (wallet) {
                wallet.balance = Number(wallet.balance) - Number(amount);
            }
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchWallets.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchWallets.fulfilled, (state, action) => {
                state.loading = false;
                state.wallets = action.payload;
            })
            .addCase(fetchWallets.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            .addCase(createWallet.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createWallet.fulfilled, (state, action) => {
                state.loading = false;
                state.wallets.unshift(action.payload);
            })
            .addCase(createWallet.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            .addCase(editWallet.fulfilled, (state, action) => {
                const index = state.wallets.findIndex(w => w.id === action.payload.id);
                if (index !== -1) {
                    state.wallets[index] = action.payload;
                }
            })

            .addCase(removeWallet.fulfilled, (state, action) => {
                state.wallets = state.wallets.filter(w => w.id !== action.payload);
            });
    }
});

export const { updateWalletBalanceLocal, increaseBalanceLocal, decreaseBalanceLocal } = walletSlice.actions;
export default walletSlice.reducer;
