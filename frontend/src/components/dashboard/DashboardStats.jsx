import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { Wallet, ArrowRightLeft, TrendingUp, TrendingDown } from "lucide-react"
import { useTranslation } from "react-i18next"

export function DashboardStats({ wallets, transactions }) {
    const { t } = useTranslation();
    const totalBalance = wallets.reduce((acc, w) => acc + w.balance, 0)

    // Simple calculation for income/expense
    const totalIncome = transactions
        .filter(t => t.type === 'INCOME')
        .reduce((acc, t) => acc + t.amount, 0)

    const totalExpense = transactions
        .filter(t => t.type === 'EXPENSE')
        .reduce((acc, t) => acc + t.amount, 0)

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Total Assets - Gradient Blue/Purple */}
            <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl border-none relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Wallet className="h-24 w-24" />
                </div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 z-10 relative">
                    <CardTitle className="text-sm font-medium text-blue-100">{t('dashboard.stats.totalAssets')}</CardTitle>
                    <Wallet className="h-4 w-4 text-blue-200" />
                </CardHeader>
                <CardContent className="z-10 relative">
                    <div className="text-3xl font-bold tracking-tight">{formatCurrency(totalBalance)}</div>
                    <p className="text-xs text-blue-200 mt-1">
                        {t('dashboard.stats.activeWallets', { count: wallets.length })}
                    </p>
                </CardContent>
            </Card>

            {/* Income - Gradient Emerald */}
            <Card className="bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg border-none relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <TrendingUp className="h-24 w-24" />
                </div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 z-10 relative">
                    <CardTitle className="text-sm font-medium text-emerald-100">{t('dashboard.stats.income')}</CardTitle>
                    <TrendingUp className="h-4 w-4 text-emerald-200" />
                </CardHeader>
                <CardContent className="z-10 relative">
                    <div className="text-2xl font-bold tracking-tight">+{formatCurrency(totalIncome)}</div>
                    <p className="text-xs text-emerald-100 mt-1">
                        {t('dashboard.stats.incomeTotal')}
                    </p>
                </CardContent>
            </Card>

            {/* Expense - Gradient Rose */}
            <Card className="bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-lg border-none relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <TrendingDown className="h-24 w-24" />
                </div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 z-10 relative">
                    <CardTitle className="text-sm font-medium text-rose-100">{t('dashboard.stats.expense')}</CardTitle>
                    <TrendingDown className="h-4 w-4 text-rose-200" />
                </CardHeader>
                <CardContent className="z-10 relative">
                    <div className="text-2xl font-bold tracking-tight">-{formatCurrency(totalExpense)}</div>
                    <p className="text-xs text-rose-100 mt-1">
                        {t('dashboard.stats.expenseTotal')}
                    </p>
                </CardContent>
            </Card>

            {/* Transactions - Glassmorphism/Neutral */}
            <Card className="bg-card/50 backdrop-blur-sm shadow-sm border-muted/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{t('dashboard.stats.transactions')}</CardTitle>
                    <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-foreground">{transactions.length}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {t('dashboard.stats.totalRecords')}
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
