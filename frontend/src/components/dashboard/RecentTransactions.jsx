import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDateString } from "@/lib/utils"
import { CreditCard, ShoppingBag, Coffee, Home, Car, Smartphone, ArrowDownLeft, ArrowUpRight } from "lucide-react"
import { useTranslation } from "react-i18next"

export function RecentTransactions({ transactions }) {
    const { t } = useTranslation();
    const recent = transactions.slice(0, 5)

    return (
        <Card className="col-span-1 shadow-md border-muted/40 h-full">
            <CardHeader>
                <CardTitle className="text-xl font-bold">{t('dashboard.recent.title')}</CardTitle>
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
                                    <p className="text-sm font-medium leading-none">{t.description}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {formatDateString(t.transaction_date)}
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
