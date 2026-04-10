import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { ArrowRightLeft, Scale, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function DashboardStats({ stats }) {
    const { t } = useTranslation();
    const safeStats = stats || {};
    const totalAssets = Number(safeStats.totalAssets || 0);
    const totalIncome = Number(safeStats.totalIncome || 0);
    const totalExpense = Number(safeStats.totalExpense || 0);
    const unassignedMoney = totalIncome - totalExpense;

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="relative overflow-hidden border-none bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl">
                <div className="absolute right-0 top-0 p-4 opacity-10">
                    <Wallet className="h-24 w-24" />
                </div>
                <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-blue-100">{t('dashboard.stats.totalAssets')}</CardTitle>
                    <Wallet className="h-4 w-4 text-blue-200" />
                </CardHeader>
                <CardContent className="relative z-10">
                    <div className="text-3xl font-bold tracking-tight">{formatCurrency(totalAssets)}</div>
                    <p className="mt-1 text-xs text-blue-200">
                        {t('dashboard.stats.activeWallets', { count: safeStats.activeWalletsCount || 0 })}
                    </p>
                </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-none bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg">
                <div className="absolute right-0 top-0 p-4 opacity-10">
                    <TrendingUp className="h-24 w-24" />
                </div>
                <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-emerald-100">{t('dashboard.stats.income')}</CardTitle>
                    <TrendingUp className="h-4 w-4 text-emerald-200" />
                </CardHeader>
                <CardContent className="relative z-10">
                    <div className="text-2xl font-bold tracking-tight">+{formatCurrency(totalIncome)}</div>
                    <p className="mt-1 text-xs text-emerald-100">{t('dashboard.stats.incomeTotal')}</p>
                </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-none bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-lg">
                <div className="absolute right-0 top-0 p-4 opacity-10">
                    <TrendingDown className="h-24 w-24" />
                </div>
                <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-rose-100">{t('dashboard.stats.expense')}</CardTitle>
                    <TrendingDown className="h-4 w-4 text-rose-200" />
                </CardHeader>
                <CardContent className="relative z-10">
                    <div className="text-2xl font-bold tracking-tight">-{formatCurrency(totalExpense)}</div>
                    <p className="mt-1 text-xs text-rose-100">{t('dashboard.stats.expenseTotal')}</p>
                </CardContent>
            </Card>

            <Card className={`relative overflow-hidden border-none shadow-sm backdrop-blur-sm ${unassignedMoney >= 0 ? 'bg-emerald-500/10' : 'bg-destructive/10'}`}>
                <div className="absolute right-0 top-0 p-4 opacity-10">
                    <Scale className={`h-24 w-24 ${unassignedMoney >= 0 ? 'text-emerald-500' : 'text-destructive'}`} />
                </div>
                <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        {t('dashboard.stats.unassigned')}
                    </CardTitle>
                    <Scale className={`h-4 w-4 ${unassignedMoney >= 0 ? 'text-emerald-500' : 'text-destructive'}`} />
                </CardHeader>
                <CardContent className="relative z-10">
                    <div className={`text-2xl font-bold ${unassignedMoney >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                        {unassignedMoney > 0 ? '+' : ''}
                        {formatCurrency(unassignedMoney)}
                    </div>
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <ArrowRightLeft className="h-3 w-3" />
                        {safeStats.transactionsThisMonthCount || 0} {t('dashboard.stats.totalRecords')}
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
