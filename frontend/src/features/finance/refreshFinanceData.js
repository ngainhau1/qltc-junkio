import { fetchDashboardAnalytics, fetchReportAnalytics } from '@/features/analytics/analyticsSlice';
import { fetchTransactions } from '@/features/transactions/transactionSlice';
import { fetchWallets } from '@/features/wallets/walletSlice';

export const refreshFinanceData = () => async (dispatch) => {
    await Promise.allSettled([
        dispatch(fetchWallets()),
        dispatch(fetchTransactions()),
        dispatch(fetchDashboardAnalytics()),
        dispatch(fetchReportAnalytics()),
    ]);
};
