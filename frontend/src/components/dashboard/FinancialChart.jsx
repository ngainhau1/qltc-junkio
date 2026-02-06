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
import { formatCurrency } from "@/lib/utils"

export function FinancialChart({ transactions }) {
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
            const date = new Date(t.date || t.transaction_date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
            // Sort key (YYYY-MM-DD) for correct ordering
            const dateObj = new Date(t.date || t.transaction_date)
            const sortKey = dateObj.toISOString().split('T')[0]

            if (!acc[sortKey]) {
                acc[sortKey] = { date, sortKey, income: 0, expense: 0 }
            }

            if (t.type === 'INCOME') {
                acc[sortKey].income += t.amount
            } else {
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
                            Xu Hướng Dòng Tiền
                        </CardTitle>
                        <CardDescription>Biểu đồ thu chi theo thời gian.</CardDescription>
                    </div>
                    <div className="flex gap-1 bg-muted/50 p-1 rounded-lg">
                        {['7D', '30D', 'ALL'].map(r => (
                            <button
                                key={r}
                                onClick={() => setRange(r)}
                                className={`text-xs font-medium px-3 py-1.5 rounded-md transition-all ${range === r ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
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
                        <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} tick={{ fill: '#6b7280' }} />
                        <YAxis
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: '#6b7280' }}
                            tickFormatter={(value) => `${value / 1000000}M`}
                        />
                        <Tooltip
                            formatter={(value) => formatCurrency(value)}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend iconType="circle" />
                        <Area
                            type="monotone"
                            dataKey="income"
                            name="Thu Nhập"
                            stroke="#10b981"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorIncome)"
                        />
                        <Area
                            type="monotone"
                            dataKey="expense"
                            name="Chi Tiêu"
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
