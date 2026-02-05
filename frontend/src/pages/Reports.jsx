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
        { name: 'Income', amount: incomeTotal },
        { name: 'Expense', amount: expenseTotal }
    ]

    // 2. Prepare Data for Pie Chart (Expense by Category)
    // Since we don't have real category names yet (just IDs like 'cat-1'), we'll group by category_id
    const categoryDataMap = transactions
        .filter(t => t.type === 'EXPENSE')
        .reduce((acc, t) => {
            const cat = t.category_id || 'Uncategorized'
            acc[cat] = (acc[cat] || 0) + t.amount
            return acc
        }, {})

    const categoryData = Object.keys(categoryDataMap).map(key => ({
        name: key,
        value: categoryDataMap[key]
    }))

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold tracking-tight">Reports & Visualization</h1>
                <p className="text-muted-foreground">Gain insights into your spending habits.</p>
            </header>

            <div className="grid gap-6 md:grid-cols-2">

                {/* Income vs Expense Bar Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Income vs Expense</CardTitle>
                        <CardDescription>Financial summary of current data.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={summaryData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip formatter={(value) => formatCurrency(value)} />
                                <Legend />
                                <Bar dataKey="amount" fill="#8884d8" name="Amount" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Category Pie Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Expenses by Category</CardTitle>
                        <CardDescription>Where your money is going.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => formatCurrency(value)} />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

            </div>
        </div>
    )
}
