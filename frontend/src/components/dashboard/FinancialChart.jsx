import { useMemo, useState } from "react"
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { formatCurrency, formatDateString } from "@/lib/utils"
import { useTranslation } from "react-i18next"

const CustomTooltip = ({ active, payload, label }) => {
    // ... tooltip code (no translation text needed inside tooltip for now, it uses localized dataKey name)
    if (active && payload && payload.length) {
        return (
            <div className="bg-popover border border-border p-3 rounded-xl shadow-lg">
                <p className="text-sm font-medium mb-2 text-popover-foreground">{label}</p>
                {payload.map((p, index) => (
                    <div key={index} className="text-sm flex items-center gap-2" style={{ color: p.color }}>
                        <span className="font-bold">{p.name}:</span>
                        <span>{formatCurrency(p.value)}</span>
                    </div>
                ))}
            </div>
        )
    }
    return null
}

export function FinancialChart({ transactions }) {
    const { t } = useTranslation();
    const [range, setRange] = useState('ALL') // '7D', '30D', 'ALL'

    const data = useMemo(() => {
        if (!transactions || transactions.length === 0) return []

        // 1. Filter by Range
        const now = new Date()
        let cutoffDate = new Date('2000-01-01')

        if (range === '7D') {
            cutoffDate = new Date()
            cutoffDate.setDate(now.getDate() - 7)
        } else if (range === '30D') {
            cutoffDate = new Date()
            cutoffDate.setDate(now.getDate() - 30)
        }

        const filtered = transactions.filter(t => new Date(t.date || t.transaction_date) >= cutoffDate)

        // 2. Aggregate by Date
        const grouped = filtered.reduce((acc, t) => {
            // Convert multiple date formats safely
            const dateStr = t.date || t.transaction_date;
            const date = dateStr ? formatDateString(dateStr, { day: '2-digit', month: '2-digit' }) : "---";
            // Sort key (YYYY-MM-DD) for correct ordering
            const dateObj = new Date(t.date || t.transaction_date)
            const sortKey = dateObj.toISOString().split('T')[0]

            if (!acc[sortKey]) {
                acc[sortKey] = { date, sortKey, income: 0, expense: 0 }
            }

            if (t.type === 'INCOME') {
                acc[sortKey].income += t.amount
            } else if (t.type === 'EXPENSE') {
                acc[sortKey].expense += t.amount
            }

            return acc
        }, {})

        // 3. Convert to Array and Sort
        return Object.values(grouped).sort((a, b) => a.sortKey.localeCompare(b.sortKey))
    }, [transactions, range])

    return (
        <Card className="col-span-4 shadow-md border-muted/40">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                            {t('dashboard.chart.title')}
                        </CardTitle>
                        <CardDescription>{t('dashboard.chart.desc')}</CardDescription>
                    </div>
                    <div className="flex gap-1 bg-muted/50 p-1 rounded-lg">
                        {['7D', '30D', 'ALL'].map(r => (
                            <button
                                key={r}
                                onClick={() => setRange(r)}
                                className={`text-xs font-medium px-3 py-1.5 rounded-md transition-all ${range === r ? 'bg-background text-primary border border-border shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data}
                        margin={{
                            top: 10,
                            right: 30,
                            left: 0,
                            bottom: 0,
                        }}
                    >
                        <defs>
                            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.5} />
                        <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} tick={{ fill: '#6b7280' }} minTickGap={20} />
                        <YAxis
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: '#6b7280' }}
                            tickFormatter={(value) => `${value / 1000000}M`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend iconType="circle" />
                        <Area
                            type="monotone"
                            dataKey="income"
                            name={t('dashboard.stats.income')}
                            stroke="#10b981"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorIncome)"
                        />
                        <Area
                            type="monotone"
                            dataKey="expense"
                            name={t('dashboard.stats.expense')}
                            stroke="#ef4444"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorExpense)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
