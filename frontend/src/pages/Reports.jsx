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
import { Download, FileSpreadsheet, FileText, MoreHorizontal } from 'lucide-react';
import {
    exportReportRowsToCSV,
    exportReportRowsToExcel,
    exportReportRowsToPDF,
} from '@/services/exportService';
import { PageHeader } from '@/components/layout/PageHeader';
import { ResponsiveActions } from '@/components/layout/ResponsiveActions';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export function Reports() {
    const { t } = useTranslation();
    const { summary, expenseByCategory, cashflowSeries, loading } = useSelector((state) => state.analytics.reports);
    const compactNumber = new Intl.NumberFormat('vi-VN', { notation: 'compact', maximumFractionDigits: 1 });

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

    const desktopActions = (
        <>
            <Button variant="outline" onClick={() => exportReportRowsToPDF(reportData, t('reports.exportTitle'))}>
                <FileText className="mr-2 h-4 w-4" /> {t('reports.btnPdf')}
            </Button>
            <Button variant="outline" onClick={() => exportReportRowsToCSV(reportData)}>
                <Download className="mr-2 h-4 w-4" /> {t('reports.btnCsv')}
            </Button>
            <Button variant="outline" onClick={() => exportReportRowsToExcel(reportData)}>
                <FileSpreadsheet className="mr-2 h-4 w-4" /> {t('transactions.exportExcel')}
            </Button>
        </>
    );

    const mobileActions = (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="touch-target w-full justify-between">
                    <span>{t('nav.menu')}</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => exportReportRowsToPDF(reportData, t('reports.exportTitle'))}>
                    <FileText className="mr-2 h-4 w-4" /> {t('reports.btnPdf')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportReportRowsToCSV(reportData)}>
                    <Download className="mr-2 h-4 w-4" /> {t('reports.btnCsv')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportReportRowsToExcel(reportData)}>
                    <FileSpreadsheet className="mr-2 h-4 w-4" /> {t('transactions.exportExcel')}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );

    return (
        <div className="space-y-6">
            <PageHeader
                title={t('reports.title')}
                description={t('reports.desc')}
                actions={<ResponsiveActions desktop={desktopActions} mobile={mobileActions} />}
            />

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
                        <CardContent className="h-[240px] sm:h-[280px] md:h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={summaryData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                    <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => compactNumber.format(value)} />
                                    <Tooltip formatter={(value) => formatCurrency(value)} cursor={{ fill: 'transparent' }} />
                                    <Legend wrapperStyle={{ paddingTop: '12px', fontSize: '11px' }} />
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
                        <CardContent className="h-[240px] sm:h-[280px] md:h-[300px]">
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
                                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
