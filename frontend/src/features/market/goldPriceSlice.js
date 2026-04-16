import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '@/lib/api';

export const GOLD_HISTORY_RANGE_OPTIONS = ['24H', '7D'];
export const HISTORY_CACHE_TTL_MS = 5 * 60 * 1000;

const createHistoryState = () => ({
    data: null,
    loading: false,
    error: null,
    lastFetchedAt: null,
});

const initialState = {
    data: null,
    loading: false,
    error: null,
    lastFetchedAt: null,
    selectedRange: '24H',
    historyByRange: {
        '24H': createHistoryState(),
        '7D': createHistoryState(),
    },
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

export const fetchGoldPriceHistory = createAsyncThunk(
    'goldPrice/fetchGoldPriceHistory',
    async ({ range }, { rejectWithValue }) => {
        try {
            const response = await api.get(`/market/gold/history?range=${range}`);
            return {
                range,
                data: response.data,
            };
        } catch (error) {
            return rejectWithValue({
                range,
                message: error.response?.data?.message || 'GOLD_PRICE_HISTORY_FETCH_FAILED',
            });
        }
    },
    {
        condition: ({ range, force = false } = {}, { getState }) => {
            if (!GOLD_HISTORY_RANGE_OPTIONS.includes(range)) {
                return false;
            }

            const historyState = getState()?.goldPrice?.historyByRange?.[range];

            if (!historyState || historyState.loading) {
                return false;
            }

            if (force) {
                return true;
            }

            if (
                historyState.data &&
                historyState.lastFetchedAt &&
                Date.now() - historyState.lastFetchedAt < HISTORY_CACHE_TTL_MS
            ) {
                return false;
            }

            return true;
        },
    }
);

const goldPriceSlice = createSlice({
    name: 'goldPrice',
    initialState,
    reducers: {
        setGoldHistoryRange: (state, action) => {
            if (GOLD_HISTORY_RANGE_OPTIONS.includes(action.payload)) {
                state.selectedRange = action.payload;
            }
        },
    },
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
            })
            .addCase(fetchGoldPriceHistory.pending, (state, action) => {
                const range = action.meta.arg?.range;

                if (!GOLD_HISTORY_RANGE_OPTIONS.includes(range)) {
                    return;
                }

                state.historyByRange[range].loading = true;
                state.historyByRange[range].error = null;
            })
            .addCase(fetchGoldPriceHistory.fulfilled, (state, action) => {
                const { range, data } = action.payload;

                if (!GOLD_HISTORY_RANGE_OPTIONS.includes(range)) {
                    return;
                }

                state.historyByRange[range].loading = false;
                state.historyByRange[range].data = data;
                state.historyByRange[range].error = null;
                state.historyByRange[range].lastFetchedAt = Date.now();
            })
            .addCase(fetchGoldPriceHistory.rejected, (state, action) => {
                const range = action.payload?.range || action.meta.arg?.range;

                if (!GOLD_HISTORY_RANGE_OPTIONS.includes(range)) {
                    return;
                }

                state.historyByRange[range].loading = false;
                state.historyByRange[range].data = null;
                state.historyByRange[range].error =
                    action.payload?.message || 'GOLD_PRICE_HISTORY_FETCH_FAILED';
            });
    },
});

export const { setGoldHistoryRange } = goldPriceSlice.actions;

export default goldPriceSlice.reducer;
