import { useSelector } from "react-redux"
import { Button } from "@/components/ui/button"
import { DashboardStats } from "@/components/dashboard/DashboardStats"
import { RecentTransactions } from "@/components/dashboard/RecentTransactions"

export function Dashboard() {
    const { user } = useSelector(state => state.auth)
    const { transactions } = useSelector(state => state.transactions)
    const { wallets } = useSelector(state => state.wallets)

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">Overview of your financial health.</p>
                </div>

                <div className="flex items-center gap-4">
                    <span className="text-muted-foreground hidden md:inline-block">Welcome, {user?.name}</span>
                    <Button>Add Transaction</Button>
                </div>
            </header>

            {/* Stats Row */}
            <DashboardStats wallets={wallets} transactions={transactions} />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Main Chart Area (Placeholder for now) */}
                <div className="col-span-4 lg:col-span-4 bg-muted/20 border border-dashed rounded-xl h-[300px] flex items-center justify-center text-muted-foreground">
                    Chart Placeholder
                </div>

                {/* Recent Transactions List */}
                <div className="col-span-3 lg:col-span-3">
                    <RecentTransactions transactions={transactions} />
                </div>
            </div>
        </div>
    )
}
