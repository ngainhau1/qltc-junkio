import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/api';

const initialState = {
    transactions: [],
    loading: false,
    error: null,
    filter: {
        startDate: null,
        endDate: null,
        categoryId: null,
        walletId: null,
    },
    pagination: {
        currentPage: 1,
        itemsPerPage: 50
    }
};

export const fetchTransactions = createAsyncThunk(
    'transactions/fetchTransactions',
    async (params, { rejectWithValue }) => {
        try {
            // params could include query strings for filtering
            const response = await api.get('/transactions', { params });
            return response.data; // Expected array or paginated object
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Lỗi tải giao dịch');
        }
    }
);

export const createTransaction = createAsyncThunk(
    'transactions/createTransaction',
    async (txData, { rejectWithValue }) => {
        try {
            const response = await api.post('/transactions', txData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Lỗi thêm giao dịch');
        }
    }
);

export const approveDebt = createAsyncThunk(
    'transactions/approveDebt',
    async (shareId, { rejectWithValue }) => {
        try {
            const response = await api.put(`/debts/${shareId}/approve`);
            return { shareId, data: response.data };
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Lỗi duyệt nợ');
        }
    }
);

export const rejectDebt = createAsyncThunk(
    'transactions/rejectDebt',
    async (shareId, { rejectWithValue }) => {
        try {
            const response = await api.put(`/debts/${shareId}/reject`);
            return { shareId, data: response.data };
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Lỗi từ chối nợ');
        }
    }
);

export const settleDebts = createAsyncThunk(
    'transactions/settleDebts',
    async (settleData, { rejectWithValue }) => {
        try {
            const response = await api.post('/debts/settle', settleData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Lỗi thanh toán nợ');
        }
    }
);


const transactionSlice = createSlice({
    name: 'transactions',
    initialState,
    reducers: {
        setFilter: (state, action) => {
            state.filter = { ...state.filter, ...action.payload };
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchTransactions.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchTransactions.fulfilled, (state, action) => {
                state.loading = false;
                state.transactions = action.payload; // Adjust if API returns { data: [] }
            })
            .addCase(fetchTransactions.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(createTransaction.fulfilled, (state, action) => {
                state.transactions.unshift(action.payload);
            })
            // Approve Debt updates
            .addCase(approveDebt.fulfilled, (state, action) => {
                const { shareId } = action.payload;
                state.transactions.forEach(t => {
                    if (t.shares) {
                        const share = t.shares.find(s => s.id === shareId);
                        if (share) share.approval_status = 'APPROVED';
                    }
                });
            })
            // Reject Debt updates
            .addCase(rejectDebt.fulfilled, (state, action) => {
                const { shareId } = action.payload;
                state.transactions.forEach(t => {
                    if (t.shares) {
                        const share = t.shares.find(s => s.id === shareId);
                        if (share) share.approval_status = 'REJECTED';
                    }
                });
            })
            // Settle Debt
            .addCase(settleDebts.fulfilled, () => {
                // Tùy theo logic API trả về, bạn có thể gọi lại fetchTransactions ở Component 
                // hoặc cập nhật state cục bộ tại đây.
            })
    },
});

export const { setFilter } = transactionSlice.actions;
export default transactionSlice.reducer;
