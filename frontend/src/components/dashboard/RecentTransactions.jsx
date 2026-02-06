import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { ArrowUpRight, ArrowDownLeft } from "lucide-react"

export function RecentTransactions({ transactions }) {
    const recent = transactions.slice(0, 5)

    return (
        <Card className="col-span-1 shadow-md border-muted/40 h-full">
            <CardHeader>
                <CardTitle className="text-xl font-bold">Giao Dịch Gần Đây</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {recent.map(t => {
                        return (
                            <div key={t.id} className="flex items-center group cursor-pointer hover:bg-muted/30 p-2 rounded-lg transition-colors -mx-2">
                                <div className={`flex h-10 w-10 items-center justify-center rounded-full border transition-transform group-hover:scale-105 ${t.type === 'INCOME' ? 'bg-emerald-100 border-emerald-200' : 'bg-rose-100 border-rose-200'}`}>
                                    {t.type === 'INCOME'
                                        ? <ArrowDownLeft className={`h-5 w-5 ${t.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`} />
                                        : <ArrowUpRight className={`h-5 w-5 ${t.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`} />
                                    }
                                </div>
                                <div className="ml-4 space-y-1 flex-1">
                                    <p className="text-sm font-medium leading-none truncate max-w-[150px]">{t.description}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {new Date(t.transaction_date).toLocaleDateString('vi-VN')}
                                    </p>
                                </div>
                                <div className={`font-semibold text-sm ${t.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
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
