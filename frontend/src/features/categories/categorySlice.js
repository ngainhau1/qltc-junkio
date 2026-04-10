import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/api';

export const fetchCategories = createAsyncThunk(
    'categories/fetchAll',
    async (_, { rejectWithValue }) => {
        try {
            const res = await api.get('/categories');
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data || 'CATEGORY_LOAD_FAILED');
        }
    }
);

const categorySlice = createSlice({
    name: 'categories',
    initialState: {
        categories: [],
        isLoading: false,
        error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchCategories.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchCategories.fulfilled, (state, action) => {
                state.isLoading = false;
                state.categories = action.payload;
            })
            .addCase(fetchCategories.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            });
    },
});

export default categorySlice.reducer;
