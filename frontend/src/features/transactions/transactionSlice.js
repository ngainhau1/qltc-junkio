import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/api';

const initialState = {
    transactions: [],
    loading: false,
    error: null,
    // Detail view state
    selectedTransaction: null,
    isDetailLoading: false,
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
            const response = await api.get('/transactions', { params });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Lỗi tải giao dịch');
        }
    }
);

export const fetchTransactionById = createAsyncThunk(
    'transactions/fetchTransactionById',
    async (id, { rejectWithValue }) => {
        try {
            const response = await api.get(`/transactions/${id}`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Lỗi tải chi tiết giao dịch');
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

export const deleteTransaction = createAsyncThunk(
    'transactions/deleteTransaction',
    async (id, { rejectWithValue }) => {
        try {
            await api.delete(`/transactions/${id}`);
            return id;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Lỗi xóa giao dịch');
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
        clearSelectedTransaction: (state) => {
            state.selectedTransaction = null;
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
                if (action.payload.transactions) {
                    state.transactions = action.payload.transactions;
                    state.pagination = {
                        currentPage: action.payload.currentPage,
                        totalItems: action.payload.totalItems,
                        totalPages: action.payload.totalPages,
                        itemsPerPage: state.pagination.itemsPerPage
                    };
                } else {
                    state.transactions = action.payload;
                }
            })
            .addCase(fetchTransactions.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Fetch Transaction By ID
            .addCase(fetchTransactionById.pending, (state) => {
                state.isDetailLoading = true;
                state.selectedTransaction = null;
            })
            .addCase(fetchTransactionById.fulfilled, (state, action) => {
                state.isDetailLoading = false;
                state.selectedTransaction = action.payload;
            })
            .addCase(fetchTransactionById.rejected, (state) => {
                state.isDetailLoading = false;
            })
            // Create
            .addCase(createTransaction.fulfilled, (state, action) => {
                state.transactions.unshift(action.payload);
            })
            // Delete
            .addCase(deleteTransaction.fulfilled, (state, action) => {
                const deletedId = action.payload;
                state.transactions = state.transactions.filter(t => t.id !== deletedId);
                if (state.selectedTransaction?.id === deletedId) {
                    state.selectedTransaction = null;
                }
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
                // Gọi lại fetchTransactions ở Component sau khi settle
            })
    },
});

export const { setFilter, clearSelectedTransaction } = transactionSlice.actions;
export default transactionSlice.reducer;
