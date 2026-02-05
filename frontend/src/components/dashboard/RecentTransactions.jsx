import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { ArrowUpRight, ArrowDownLeft, ShoppingBag, Utensils, Zap, Bus } from "lucide-react"

// Helper to get icon based on category (mock logic)
const getCategoryIcon = (categoryName) => {
    if (categoryName?.includes('Food')) return Utensils
    if (categoryName?.includes('Shopping')) return ShoppingBag
    if (categoryName?.includes('Utilities')) return Zap
    if (categoryName?.includes('Transportation')) return Bus
    return ArrowRightLeft
}

export function RecentTransactions({ transactions }) {
    const recent = transactions.slice(0, 5)

    return (
        <Card className="col-span-1">
            <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-8">
                    {recent.map(t => {
                        // const Icon = getCategoryIcon('Food') // Placeholder logic as we don't have category names in transaction object directly yet, only ID. 
                        // Wait, seeder puts description. We can use that or type.

                        return (
                            <div key={t.id} className="flex items-center">
                                <div className={`flex h-9 w-9 items-center justify-center rounded-full border ${t.type === 'INCOME' ? 'bg-green-100 border-green-200' : 'bg-red-100 border-red-200'}`}>
                                    {t.type === 'INCOME'
                                        ? <ArrowDownLeft className={`h-5 w-5 ${t.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`} />
                                        : <ArrowUpRight className={`h-5 w-5 ${t.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`} />
                                    }
                                </div>
                                <div className="ml-4 space-y-1">
                                    <p className="text-sm font-medium leading-none">{t.description}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {new Date(t.transaction_date).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className={`ml-auto font-medium ${t.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                                    {t.type === 'INCOME' ? '+' : '-'}{formatCurrency(t.amount)}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}
import { ArrowRightLeft } from "lucide-react"
