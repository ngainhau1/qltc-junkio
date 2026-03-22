import { useSelector } from 'react-redux';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { FinancialChart } from '@/components/dashboard/FinancialChart';
import { useTranslation } from 'react-i18next';

export function Dashboard() {
    const { t } = useTranslation();
    const { stats, recentTransactions, cashflowSeries, loading } = useSelector(
        (state) => state.analytics.dashboard
    );

    return (
        <div className="space-y-6">
            <header className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.title')}</h1>
                    <p className="text-muted-foreground">{t('dashboard.desc')}</p>
                </div>

                <div className="flex items-center gap-4">
                    <img src="/logo.png" alt="Logo" className="h-8 w-8 md:hidden" />
                </div>
            </header>

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
