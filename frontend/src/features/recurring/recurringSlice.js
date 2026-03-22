import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '@/lib/api';

const normalizeRecurringRule = (rule) => {
    const description = rule?.description || rule?.name || '';
    const isActive = Boolean(rule?.is_active ?? rule?.active ?? true);
    const nextRunDate = rule?.next_run_date || rule?.nextDueDate || rule?.start_date || null;

    return {
        ...rule,
        name: description,
        description,
        walletId: rule?.wallet_id || rule?.walletId || '',
        categoryId: rule?.category_id || rule?.categoryId || '',
        nextDueDate: nextRunDate,
        next_run_date: nextRunDate,
        active: isActive,
        is_active: isActive,
    };
};

const toRecurringPayload = (ruleData) => ({
    wallet_id: ruleData.wallet_id || ruleData.walletId,
    category_id: ruleData.category_id || ruleData.categoryId || null,
    amount: ruleData.amount,
    type: ruleData.type,
    description: ruleData.description || ruleData.name || '',
    frequency: ruleData.frequency,
    next_run_date: ruleData.next_run_date || ruleData.nextDueDate || ruleData.startDate,
    is_active: ruleData.is_active ?? ruleData.active,
});

const initialState = {
    rules: [],
    loading: false,
    error: null,
};

export const fetchRecurring = createAsyncThunk(
    'recurring/fetchRecurring',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/recurring');
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Loi tai lich dinh ky');
        }
    }
);

export const createRecurring = createAsyncThunk(
    'recurring/createRecurring',
    async (ruleData, { rejectWithValue }) => {
        try {
            const response = await api.post('/recurring', toRecurringPayload(ruleData));
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Loi tao dinh ky');
        }
    }
);

export const editRecurring = createAsyncThunk(
    'recurring/editRecurring',
    async ({ id, data }, { rejectWithValue }) => {
        try {
            const response = await api.put(`/recurring/${id}`, toRecurringPayload(data));
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Loi cap nhat dinh ky');
        }
    }
);

export const removeRecurring = createAsyncThunk(
    'recurring/removeRecurring',
    async (id, { rejectWithValue }) => {
        try {
            await api.delete(`/recurring/${id}`);
            return id;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Loi xoa dinh ky');
        }
    }
);

const recurringSlice = createSlice({
    name: 'recurring',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchRecurring.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchRecurring.fulfilled, (state, action) => {
                state.loading = false;
                state.rules = Array.isArray(action.payload)
                    ? action.payload.map(normalizeRecurringRule)
                    : [];
            })
            .addCase(fetchRecurring.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(createRecurring.fulfilled, (state, action) => {
                state.rules.unshift(normalizeRecurringRule(action.payload));
            })
            .addCase(editRecurring.fulfilled, (state, action) => {
                const index = state.rules.findIndex((rule) => rule.id === action.payload.id);
                if (index !== -1) {
                    state.rules[index] = normalizeRecurringRule(action.payload);
                }
            })
            .addCase(removeRecurring.fulfilled, (state, action) => {
                state.rules = state.rules.filter((rule) => rule.id !== action.payload);
            });
    },
});

export default recurringSlice.reducer;
