import { useSelector } from 'react-redux';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { FinancialChart } from '@/components/dashboard/FinancialChart';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/layout/PageHeader';

export function Dashboard() {
    const { t } = useTranslation();
    const { stats, recentTransactions, cashflowSeries, loading } = useSelector(
        (state) => state.analytics.dashboard
    );

    return (
        <div className="space-y-6">
            <PageHeader
                className="mb-2"
                title={t('dashboard.title')}
                description={t('dashboard.desc')}
                actions={<img src="/logo.png" alt="Logo" className="h-8 w-8 md:hidden" />}
            />

            <DashboardStats stats={stats} />

            {loading ? (
                <div className="flex min-h-[280px] items-center justify-center rounded-xl border bg-card">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    <div className="col-span-4 lg:col-span-4">
                        <FinancialChart data={cashflowSeries} />
                    </div>

                    <div className="col-span-3 lg:col-span-3">
                        <RecentTransactions transactions={recentTransactions} />
                    </div>
                </div>
            )}
        </div>
    );
}
