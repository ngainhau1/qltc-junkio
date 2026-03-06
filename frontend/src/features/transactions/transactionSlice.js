import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    transactions: [],
    loading: false,
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

const transactionSlice = createSlice({
    name: 'transactions',
    initialState,
    reducers: {
        setTransactions: (state, action) => {
            state.transactions = action.payload;
        },
        addTransaction: (state, action) => {
            state.transactions.unshift(action.payload); // Add to top
        },
        setFilter: (state, action) => {
            state.filter = { ...state.filter, ...action.payload };
        },
        updateShareApprovalStatus: (state, action) => {
            const { transactionId, shareId, newStatus } = action.payload;
            const transaction = state.transactions.find(t => t.id === transactionId);
            if (transaction && transaction.shares) {
                const share = transaction.shares.find(s => s.id === shareId);
                if (share) {
                    share.approval_status = newStatus;
                }
            }
        }
    },
});

export const { setTransactions, addTransaction, setFilter, updateShareApprovalStatus } = transactionSlice.actions;
export default transactionSlice.reducer;
