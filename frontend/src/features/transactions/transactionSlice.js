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
        }
    },
});

export const { setTransactions, addTransaction, setFilter } = transactionSlice.actions;
export default transactionSlice.reducer;
