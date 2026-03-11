import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/api';

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
            return rejectWithValue(error.response?.data?.message || 'Lỗi tải lịch định kỳ');
        }
    }
);

export const createRecurring = createAsyncThunk(
    'recurring/createRecurring',
    async (ruleData, { rejectWithValue }) => {
        try {
            const response = await api.post('/recurring', ruleData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Lỗi tạo định kỳ');
        }
    }
);

export const editRecurring = createAsyncThunk(
    'recurring/editRecurring',
    async ({ id, data }, { rejectWithValue }) => {
        try {
            const response = await api.put(`/recurring/${id}`, data);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Lỗi cập nhật định kỳ');
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
            return rejectWithValue(error.response?.data?.message || 'Lỗi xóa định kỳ');
        }
    }
);

const recurringSlice = createSlice({
    name: 'recurring',
    initialState,
    reducers: {
        // Local reducers can exist if needed
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchRecurring.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchRecurring.fulfilled, (state, action) => {
                state.loading = false;
                state.rules = action.payload;
            })
            .addCase(fetchRecurring.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(createRecurring.fulfilled, (state, action) => {
                state.rules.unshift(action.payload);
            })
            .addCase(editRecurring.fulfilled, (state, action) => {
                const index = state.rules.findIndex(r => r.id === action.payload.id);
                if (index !== -1) {
                    state.rules[index] = action.payload;
                }
            })
            .addCase(removeRecurring.fulfilled, (state, action) => {
                state.rules = state.rules.filter(r => r.id !== action.payload);
            });
    },
});

export default recurringSlice.reducer;
