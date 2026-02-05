import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { Wallet, ArrowRightLeft, TrendingUp, TrendingDown } from "lucide-react"

export function DashboardStats({ wallets, transactions }) {
    const totalBalance = wallets.reduce((acc, w) => acc + w.balance, 0)

    // Simple calculation for income/expense from mocked transactions (last 30 days ideally, but using all for now)
    const totalIncome = transactions
        .filter(t => t.type === 'INCOME')
        .reduce((acc, t) => acc + t.amount, 0)

    const totalExpense = transactions
        .filter(t => t.type === 'EXPENSE')
        .reduce((acc, t) => acc + t.amount, 0)

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-primary text-primary-foreground shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium opacity-90">Net Balance</CardTitle>
                    <Wallet className="h-4 w-4 opacity-75" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(totalBalance)}</div>
                    <p className="text-xs opacity-75">
                        Across {wallets.length} wallets
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Income</CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-600">+{formatCurrency(totalIncome)}</div>
                    <p className="text-xs text-muted-foreground">
                        Total mocked income
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Expense</CardTitle>
                    <TrendingDown className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-red-600">-{formatCurrency(totalExpense)}</div>
                    <p className="text-xs text-muted-foreground">
                        Total mocked expense
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Transactions</CardTitle>
                    <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{transactions.length}</div>
                    <p className="text-xs text-muted-foreground">
                        Total records
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
