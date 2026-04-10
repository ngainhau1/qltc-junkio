import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '@/lib/api';
import { buildTransactionQueryFromState } from '@/features/finance/context';

const initialState = {
    transactions: [],
    loading: false,
    error: null,
    selectedTransaction: null,
    isDetailLoading: false,
    filter: {
        startDate: '',
        endDate: '',
        categoryId: '',
        walletId: '',
        search: '',
        type: '',
        sortBy: 'date',
        sortOrder: 'DESC',
    },
    pagination: {
        currentPage: 1,
        itemsPerPage: 50,
        totalItems: 0,
        totalPages: 0,
    },
};

export const fetchTransactions = createAsyncThunk(
    'transactions/fetchTransactions',
    async (params = {}, { getState, rejectWithValue }) => {
        try {
            const response = await api.get('/transactions', {
                params: buildTransactionQueryFromState(getState(), params),
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'TRANSACTIONS_LOAD_FAILED');
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
            return rejectWithValue(error.response?.data?.message || 'TRANSACTION_LOAD_FAILED');
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
            return rejectWithValue(error.response?.data?.message || 'TRANSACTION_CREATE_FAILED');
        }
    }
);

export const createTransfer = createAsyncThunk(
    'transactions/createTransfer',
    async (transferData, { rejectWithValue }) => {
        try {
            const response = await api.post('/transactions/transfer', transferData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'TRANSFER_FAILED');
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
            return rejectWithValue(error.response?.data?.message || 'TRANSACTION_DELETE_FAILED');
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
            return rejectWithValue(error.response?.data?.message || 'APPROVE_DEBT_FAILED');
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
            return rejectWithValue(error.response?.data?.message || 'REJECT_DEBT_FAILED');
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
            return rejectWithValue(error.response?.data?.message || 'SETTLE_DEBT_FAILED');
        }
    }
);

const transactionSlice = createSlice({
    name: 'transactions',
    initialState,
    reducers: {
        setFilter: (state, action) => {
            state.filter = { ...state.filter, ...action.payload };
            state.pagination.currentPage = 1;
        },
        setCurrentPage: (state, action) => {
            state.pagination.currentPage = action.payload;
        },
        setItemsPerPage: (state, action) => {
            state.pagination.itemsPerPage = action.payload;
            state.pagination.currentPage = 1;
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
                state.transactions = action.payload?.transactions ?? [];
                state.pagination = {
                    ...state.pagination,
                    currentPage: action.payload?.currentPage ?? state.pagination.currentPage,
                    totalItems: action.payload?.totalItems ?? state.pagination.totalItems,
                    totalPages: action.payload?.totalPages ?? state.pagination.totalPages,
                };
            })
            .addCase(fetchTransactions.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(fetchTransactionById.pending, (state) => {
                state.isDetailLoading = true;
                state.selectedTransaction = null;
            })
            .addCase(fetchTransactionById.fulfilled, (state, action) => {
                state.isDetailLoading = false;
                state.selectedTransaction = action.payload;
            })
            .addCase(fetchTransactionById.rejected, (state, action) => {
                state.isDetailLoading = false;
                state.error = action.payload;
            })
            .addCase(createTransaction.pending, (state) => {
                state.error = null;
            })
            .addCase(createTransaction.fulfilled, (state) => {
                state.error = null;
            })
            .addCase(createTransaction.rejected, (state, action) => {
                state.error = action.payload;
            })
            .addCase(createTransfer.pending, (state) => {
                state.error = null;
            })
            .addCase(createTransfer.fulfilled, (state) => {
                state.error = null;
            })
            .addCase(createTransfer.rejected, (state, action) => {
                state.error = action.payload;
            })
            .addCase(deleteTransaction.fulfilled, (state, action) => {
                state.error = null;
                if (state.selectedTransaction?.id === action.payload) {
                    state.selectedTransaction = null;
                }
            })
            .addCase(deleteTransaction.rejected, (state, action) => {
                state.error = action.payload;
            })
            .addCase(approveDebt.fulfilled, (state, action) => {
                const { shareId } = action.payload;
                state.transactions.forEach((transaction) => {
                    const shares = transaction.Shares || transaction.shares;
                    if (shares) {
                        const share = shares.find((item) => item.id === shareId);
                        if (share) share.approval_status = 'APPROVED';
                    }
                });
            })
            .addCase(rejectDebt.fulfilled, (state, action) => {
                const { shareId } = action.payload;
                state.transactions.forEach((transaction) => {
                    const shares = transaction.Shares || transaction.shares;
                    if (shares) {
                        const share = shares.find((item) => item.id === shareId);
                        if (share) share.approval_status = 'REJECTED';
                    }
                });
            })
            .addCase(settleDebts.rejected, (state, action) => {
                state.error = action.payload;
            });
    },
});

export const { setFilter, setCurrentPage, setItemsPerPage, clearSelectedTransaction } = transactionSlice.actions;
export default transactionSlice.reducer;
