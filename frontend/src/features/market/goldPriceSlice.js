import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '@/lib/api';

const initialState = {
    data: null,
    loading: false,
    error: null,
    lastFetchedAt: null,
};

export const fetchGoldPrice = createAsyncThunk(
    'goldPrice/fetchGoldPrice',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/market/gold');
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'GOLD_PRICE_FETCH_FAILED');
        }
    },
    {
        condition: (_, { getState }) => !getState()?.goldPrice?.loading,
    }
);

const goldPriceSlice = createSlice({
    name: 'goldPrice',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchGoldPrice.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchGoldPrice.fulfilled, (state, action) => {
                state.loading = false;
                state.data = action.payload;
                state.error = null;
                state.lastFetchedAt = Date.now();
            })
            .addCase(fetchGoldPrice.rejected, (state, action) => {
                state.loading = false;
                state.data = null;
                state.error = action.payload;
            });
    },
});

export default goldPriceSlice.reducer;
