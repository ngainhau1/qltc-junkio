import { useSelector } from "react-redux"
import { Button } from "@/components/ui/button"
import { DashboardStats } from "@/components/dashboard/DashboardStats"
import { RecentTransactions } from "@/components/dashboard/RecentTransactions"
import { FinancialChart } from "@/components/dashboard/FinancialChart"

export function Dashboard() {
    const { transactions } = useSelector(state => state.transactions)
    const { wallets } = useSelector(state => state.wallets)

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Tổng Quan</h1>
                    <p className="text-muted-foreground">Bức tranh toàn cảnh về tài chính của bạn.</p>
                </div>

                <div className="flex items-center gap-4">
                    <img src="/logo.png" alt="Logo" className="h-8 w-8 md:hidden" />
                </div>
            </header>

            {/* Stats Row */}
            <DashboardStats wallets={wallets} transactions={transactions} />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Main Chart Area */}
                <div className="col-span-4 lg:col-span-4">
                    <FinancialChart transactions={transactions} />
                </div>

                {/* Recent Transactions List */}
                <div className="col-span-3 lg:col-span-3">
                    <RecentTransactions transactions={transactions} />
                </div>
            </div>
        </div>
    )
}
