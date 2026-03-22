import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '@/lib/api';
import { buildAnalyticsQueryFromState, cleanQueryParams } from '@/features/finance/context';

const initialState = {
    dashboard: {
        stats: {
            totalAssets: 0,
            totalIncome: 0,
            totalExpense: 0,
            activeWalletsCount: 0,
            transactionsThisMonthCount: 0,
        },
        recentTransactions: [],
        cashflowSeries: [],
        loading: false,
        error: null,
    },
    reports: {
        summary: {
            totalIncome: 0,
            totalExpense: 0,
            net: 0,
            transactionCount: 0,
        },
        expenseByCategory: [],
        cashflowSeries: [],
        filters: {
            startDate: '',
            endDate: '',
            type: '',
            walletId: '',
            categoryId: '',
        },
        loading: false,
        error: null,
    },
};

const buildReportFilters = (state, overrides = {}) => {
    const currentFilters = state?.analytics?.reports?.filters ?? initialState.reports.filters;

    return {
        startDate: overrides.startDate ?? currentFilters.startDate ?? '',
        endDate: overrides.endDate ?? currentFilters.endDate ?? '',
        type: overrides.type ?? currentFilters.type ?? '',
        walletId: overrides.walletId ?? currentFilters.walletId ?? '',
        categoryId: overrides.categoryId ?? currentFilters.categoryId ?? '',
    };
};

export const fetchDashboardAnalytics = createAsyncThunk(
    'analytics/fetchDashboardAnalytics',
    async (params = {}, { getState, rejectWithValue }) => {
        try {
            const response = await api.get('/analytics/dashboard', {
                params: buildAnalyticsQueryFromState(getState(), params),
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Loi tai tong quan');
        }
    }
);

export const fetchReportAnalytics = createAsyncThunk(
    'analytics/fetchReportAnalytics',
    async (params = {}, { getState, rejectWithValue }) => {
        try {
            const filters = buildReportFilters(getState(), params);
            const response = await api.get('/analytics/reports', {
                params: cleanQueryParams({
                    ...buildAnalyticsQueryFromState(getState(), filters),
                    type: filters.type,
                    wallet_id: filters.walletId,
                    category_id: filters.categoryId,
                }),
            });

            return {
                data: response.data,
                filters,
            };
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Loi tai bao cao');
        }
    }
);

const analyticsSlice = createSlice({
    name: 'analytics',
    initialState,
    reducers: {
        setReportFilters: (state, action) => {
            state.reports.filters = {
                ...state.reports.filters,
                ...action.payload,
            };
        },
        resetReportFilters: (state) => {
            state.reports.filters = initialState.reports.filters;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchDashboardAnalytics.pending, (state) => {
                state.dashboard.loading = true;
                state.dashboard.error = null;
            })
            .addCase(fetchDashboardAnalytics.fulfilled, (state, action) => {
                state.dashboard.loading = false;
                state.dashboard.stats = action.payload?.stats ?? initialState.dashboard.stats;
                state.dashboard.recentTransactions = action.payload?.recentTransactions ?? [];
                state.dashboard.cashflowSeries = action.payload?.cashflowSeries ?? [];
            })
            .addCase(fetchDashboardAnalytics.rejected, (state, action) => {
                state.dashboard.loading = false;
                state.dashboard.error = action.payload;
            })
            .addCase(fetchReportAnalytics.pending, (state) => {
                state.reports.loading = true;
                state.reports.error = null;
            })
            .addCase(fetchReportAnalytics.fulfilled, (state, action) => {
                state.reports.loading = false;
                state.reports.summary = action.payload?.data?.summary ?? initialState.reports.summary;
                state.reports.expenseByCategory = action.payload?.data?.expenseByCategory ?? [];
                state.reports.cashflowSeries = action.payload?.data?.cashflowSeries ?? [];
                state.reports.filters = action.payload?.filters ?? state.reports.filters;
            })
            .addCase(fetchReportAnalytics.rejected, (state, action) => {
                state.reports.loading = false;
                state.reports.error = action.payload;
            });
    },
});

export const { setReportFilters, resetReportFilters } = analyticsSlice.actions;
export default analyticsSlice.reducer;
