import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { GoldPriceCard } from '@/components/dashboard/GoldPriceCard';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { FinancialChart } from '@/components/dashboard/FinancialChart';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/layout/PageHeader';
import { fetchDashboardAnalytics } from '@/features/analytics/analyticsSlice';

const formatDateParam = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const buildCashflowRangeParams = (range) => {
    if (range === 'ALL') {
        return {};
    }

    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - (range === '30D' ? 29 : 6));

    return {
        startDate: formatDateParam(startDate),
        endDate: formatDateParam(today),
    };
};

export function Dashboard() {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const [cashflowRange, setCashflowRange] = useState('7D');
    const { stats, recentTransactions, cashflowSeries, loading } = useSelector(
        (state) => state.analytics.dashboard
    );
    const { activeFamilyId } = useSelector((state) => state.families);
    const cashflowParams = useMemo(() => buildCashflowRangeParams(cashflowRange), [cashflowRange]);

    useEffect(() => {
        dispatch(fetchDashboardAnalytics(cashflowParams));
    }, [dispatch, cashflowParams, activeFamilyId]);

    return (
        <div className="space-y-6">
            <PageHeader
                className="mb-2"
                title={t('dashboard.title')}
                description={t('dashboard.desc')}
                actions={<img src="/logo.png" alt="Logo" className="h-8 w-8 md:hidden" />}
            />
            <DashboardStats stats={stats} />
            //giá vàng
            <GoldPriceCard />

            {loading ? (
                <div className="flex min-h-[280px] items-center justify-center rounded-xl border bg-card">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    <div className="col-span-4 lg:col-span-4">
                        <FinancialChart
                            data={cashflowSeries}
                            range={cashflowRange}
                            onRangeChange={setCashflowRange}
                        />
                    </div>

                    <div className="col-span-3 lg:col-span-3">
                        <RecentTransactions transactions={recentTransactions} />
                    </div>
                </div>
            )}
        </div>
    );
}
