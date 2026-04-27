import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '@/lib/api';

const initialState = {
    items: [],
    isLoading: false,
    isSubmitting: false,
    deletingId: null,
    error: null,
};

export const fetchBudgets = createAsyncThunk(
    'budgets/fetchBudgets',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/budgets');
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'BUDGET_LOAD_FAILED');
        }
    }
);

export const createBudget = createAsyncThunk(
    'budgets/createBudget',
    async (budgetData, { rejectWithValue }) => {
        try {
            const response = await api.post('/budgets', budgetData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'BUDGET_CREATE_FAILED');
        }
    }
);

export const updateBudget = createAsyncThunk(
    'budgets/updateBudget',
    async ({ id, data }, { rejectWithValue }) => {
        try {
            const response = await api.put(`/budgets/${id}`, data);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'BUDGET_UPDATE_FAILED');
        }
    }
);

export const deleteBudget = createAsyncThunk(
    'budgets/deleteBudget',
    async (id, { rejectWithValue }) => {
        try {
            await api.delete(`/budgets/${id}`);
            return id;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'BUDGET_DELETE_FAILED');
        }
    }
);

const budgetSlice = createSlice({
    name: 'budgets',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchBudgets.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchBudgets.fulfilled, (state, action) => {
                state.isLoading = false;
                state.items = action.payload;
            })
            .addCase(fetchBudgets.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })
            .addCase(createBudget.pending, (state) => {
                state.isSubmitting = true;
                state.error = null;
            })
            .addCase(createBudget.fulfilled, (state, action) => {
                state.isSubmitting = false;
                state.items.unshift(action.payload);
            })
            .addCase(createBudget.rejected, (state, action) => {
                state.isSubmitting = false;
                state.error = action.payload;
            })
            .addCase(updateBudget.pending, (state) => {
                state.isSubmitting = true;
                state.error = null;
            })
            .addCase(updateBudget.fulfilled, (state, action) => {
                state.isSubmitting = false;
                const index = state.items.findIndex((budget) => budget.id === action.payload.id);
                if (index !== -1) {
                    state.items[index] = action.payload;
                }
            })
            .addCase(updateBudget.rejected, (state, action) => {
                state.isSubmitting = false;
                state.error = action.payload;
            })
            .addCase(deleteBudget.pending, (state, action) => {
                state.deletingId = action.meta.arg;
                state.error = null;
            })
            .addCase(deleteBudget.fulfilled, (state, action) => {
                state.deletingId = null;
                state.items = state.items.filter((budget) => budget.id !== action.payload);
            })
            .addCase(deleteBudget.rejected, (state, action) => {
                state.deletingId = null;
                state.error = action.payload;
            });
    },
});

export default budgetSlice.reducer;
