import { useSelector } from "react-redux"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { formatCurrency } from "@/lib/utils"
import { ArrowUpRight, ArrowDownLeft } from "lucide-react"

export function Transactions() {
    const { transactions } = useSelector(state => state.transactions)

    // Group transactions by Date
    const groupedTransactions = transactions.reduce((groups, transaction) => {
        const date = new Date(transaction.transaction_date).toLocaleDateString()
        if (!groups[date]) {
            groups[date] = []
        }
        groups[date].push(transaction)
        return groups
    }, {})

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
                    <p className="text-muted-foreground">Manage and view all your expenses.</p>
                </div>
            </header>

            {/* Filter Bar (Placeholder) */}
            <div className="flex gap-4">
                <Input placeholder="Search transactions..." className="max-w-xs" />
            </div>

            <div className="space-y-6">
                {Object.keys(groupedTransactions).map(date => (
                    <Card key={date}>
                        <CardHeader className="py-3 bg-muted/20">
                            <CardTitle className="text-sm font-medium">{date}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {groupedTransactions[date].map(t => (
                                <div key={t.id} className="flex items-center justify-between p-4 border-b last:border-0 hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={`flex h-10 w-10 items-center justify-center rounded-full border ${t.type === 'INCOME' ? 'bg-green-100 border-green-200' : 'bg-red-100 border-red-200'}`}>
                                            {t.type === 'INCOME'
                                                ? <ArrowDownLeft className={`h-5 w-5 ${t.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`} />
                                                : <ArrowUpRight className={`h-5 w-5 ${t.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`} />
                                            }
                                        </div>
                                        <div>
                                            <p className="font-medium">{t.description}</p>
                                            <p className="text-xs text-muted-foreground capitalize">{t.category_id}</p>
                                        </div>
                                    </div>
                                    <div className={`font-semibold ${t.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                                        {t.type === 'INCOME' ? '+' : '-'}{formatCurrency(t.amount)}
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
