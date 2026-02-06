import { useSelector } from "react-redux"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts'
import { formatCurrency } from "@/lib/utils"

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export function Reports() {
    const { transactions } = useSelector(state => state.transactions)

    // 1. Prepare Data for Bar Chart (Income vs Expense by Month)
    // For mock data, we might only have one month, so let's group by Day instead for better visualization if range is short
    // Or group by "Type" if we just want a summary. 
    // Let's do a simple aggregation: Total Income vs Total Expense

    const incomeTotal = transactions
        .filter(t => t.type === 'INCOME')
        .reduce((sum, t) => sum + t.amount, 0)

    const expenseTotal = transactions
        .filter(t => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + t.amount, 0)

    const summaryData = [
        { name: 'Thu Nhập', amount: incomeTotal },
        { name: 'Chi Tiêu', amount: expenseTotal }
    ]

    // 2. Prepare Data for Donut Chart (Expense by Category - Top 5 + Others)
    const categoryData = transactions
        .filter(t => t.type === 'EXPENSE')
        .reduce((acc, t) => {
            const cat = t.category_id || 'Uncategorized'
            if (!acc[cat]) {
                // In a real app we would lookup category name from ID
                // For now we map static IDs to names if possible or use ID
                acc[cat] = { name: cat, value: 0 }
            }
            acc[cat].value += t.amount
            return acc
        }, {})

    // Sort and Aggregate
    let sortedCategories = Object.values(categoryData).sort((a, b) => b.value - a.value)

    if (sortedCategories.length > 5) {
        const top5 = sortedCategories.slice(0, 5)
        const othersValue = sortedCategories.slice(5).reduce((sum, c) => sum + c.value, 0)
        sortedCategories = [...top5, { name: 'Khác', value: othersValue }]
    }

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold tracking-tight">Báo Cáo & Thống Kê</h1>
                <p className="text-muted-foreground">Hiểu rõ hơn về thói quen chi tiêu của bạn.</p>
            </header>

            <div className="grid gap-6 md:grid-cols-2">

                {/* Income vs Expense Bar Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Thu và Chi</CardTitle>
                        <CardDescription>Tổng hợp tài chính dựa trên dữ liệu hiện tại.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={summaryData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000000}M`} />
                                <Tooltip
                                    formatter={(value) => formatCurrency(value)}
                                    cursor={{ fill: 'transparent' }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                <Bar dataKey="amount" fill="#3b82f6" name="Số Tiền" radius={[4, 4, 0, 0]} barSize={50} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Category Donut Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Chi Tiêu Theo Danh Mục</CardTitle>
                        <CardDescription>Top 5 danh mục chi tiêu nhiều nhất.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={sortedCategories}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {sortedCategories.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => formatCurrency(value)} />
                                <Legend layout="vertical" verticalAlign="middle" align="right" />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

            </div>
        </div>
    )
}
