import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/api';

// GHI CHÚ HỌC TẬP - Phần ví của Thành Đạt:
// Slice này giữ danh sách ví ở frontend và gọi các API /wallets.
// Backend vẫn là nơi kiểm quyền ví cá nhân/ví gia đình; frontend chỉ phản ánh kết quả lên UI.

const initialState = {
    wallets: [],
    loading: false,
    error: null,
};

// --- Thunks ---
// fetchWallets lấy toàn bộ ví mà user được phép xem theo token hiện tại.
export const fetchWallets = createAsyncThunk(
    'wallets/fetchWallets',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/wallets');
            return response.data; // array of wallets
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'WALLET_LOAD_FAILED');
        }
    }
);

// createWallet gửi dữ liệu form lên backend; nếu family_id có giá trị thì tạo ví gia đình.
export const createWallet = createAsyncThunk(
    'wallets/createWallet',
    async (walletData, { rejectWithValue }) => {
        try {
            const response = await api.post('/wallets', walletData);
            return response.data; // new wallet object
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'WALLET_CREATE_FAILED');
        }
    }
);

// editWallet cập nhật một ví theo id; controller sẽ kiểm quyền trước khi lưu.
export const editWallet = createAsyncThunk(
    'wallets/editWallet',
    async ({ id, data }, { rejectWithValue }) => {
        try {
            const response = await api.put(`/wallets/${id}`, data);
            return response.data; // updated wallet object
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'WALLET_UPDATE_FAILED');
        }
    }
);

// removeWallet xóa ví theo id; backend sẽ từ chối nếu ví đã có giao dịch.
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
        // Reducers local dùng để cập nhật số dư trên UI ngay khi giao dịch thay đổi.
        // Các hàm này không thay thế dữ liệu chuẩn từ backend, chỉ giúp giao diện phản hồi nhanh hơn.
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
            // Fetch Wallets
            .addCase(fetchWallets.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchWallets.fulfilled, (state, action) => {
                state.loading = false;
                // API trả đúng danh sách ví trong phạm vi user được phép truy cập.
                state.wallets = action.payload;
            })
            .addCase(fetchWallets.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Create Wallet
            .addCase(createWallet.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createWallet.fulfilled, (state, action) => {
                state.loading = false;
                // Ví mới được đưa lên đầu danh sách để người dùng thấy ngay.
                state.wallets.unshift(action.payload); // Add to beginning
            })
            .addCase(createWallet.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Edit Wallet
            .addCase(editWallet.fulfilled, (state, action) => {
                const index = state.wallets.findIndex(w => w.id === action.payload.id);
                if (index !== -1) {
                    state.wallets[index] = action.payload;
                }
            })

            // Remove Wallet
            .addCase(removeWallet.fulfilled, (state, action) => {
                state.wallets = state.wallets.filter(w => w.id !== action.payload);
            });
    }
});

export const { updateWalletBalanceLocal, increaseBalanceLocal, decreaseBalanceLocal } = walletSlice.actions;
export default walletSlice.reducer;
