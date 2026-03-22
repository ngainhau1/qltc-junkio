import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';
import {
    exportReportRowsToCSV,
    exportReportRowsToExcel,
    exportReportRowsToPDF,
} from '@/services/exportService';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export function Reports() {
    const { t } = useTranslation();
    const { summary, expenseByCategory, cashflowSeries, loading } = useSelector((state) => state.analytics.reports);

    const summaryData = [
        { name: t('reports.income'), amount: Number(summary.totalIncome || 0) },
        { name: t('reports.expense'), amount: Number(summary.totalExpense || 0) },
        { name: t('dashboard.stats.unassigned'), amount: Number(summary.net || 0) },
    ];

    const reportData = {
        summary,
        expenseByCategory,
        cashflowSeries,
    };

    return (
        <div className="space-y-6">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('reports.title')}</h1>
                    <p className="text-muted-foreground">{t('reports.desc')}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => exportReportRowsToPDF(reportData, t('reports.exportTitle'))}>
                        <FileText className="mr-2 h-4 w-4" /> {t('reports.btnPdf')}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => exportReportRowsToCSV(reportData)}>
                        <Download className="mr-2 h-4 w-4" /> {t('reports.btnCsv')}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => exportReportRowsToExcel(reportData)}>
                        <Download className="mr-2 h-4 w-4" /> {t('transactions.exportExcel')}
                    </Button>
                </div>
            </header>

            {loading ? (
                <div className="flex min-h-[320px] items-center justify-center rounded-xl border bg-card">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('reports.summaryTitle')}</CardTitle>
                            <CardDescription>{t('reports.summaryDesc')}</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={summaryData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                    <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `${value / 1000000}M`} />
                                    <Tooltip formatter={(value) => formatCurrency(value)} cursor={{ fill: 'transparent' }} />
                                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                    <Bar dataKey="amount" fill="#3b82f6" name={t('reports.amount')} radius={[4, 4, 0, 0]} barSize={50} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t('reports.categoryTitle')}</CardTitle>
                            <CardDescription>{t('reports.categoryDesc')}</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={expenseByCategory}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {expenseByCategory.map((entry, index) => (
                                            <Cell key={`${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => formatCurrency(value)} />
                                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
