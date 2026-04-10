import { useMemo, useState } from 'react';
import {
    Area,
    AreaChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatDateString } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="rounded-xl border border-border bg-popover p-3 shadow-lg">
                <p className="mb-2 text-sm font-medium text-popover-foreground">{label}</p>
                {payload.map((item) => (
                    <div key={item.name} className="flex items-center gap-2 text-sm" style={{ color: item.color }}>
                        <span className="font-bold">{item.name}:</span>
                        <span>{formatCurrency(item.value)}</span>
                    </div>
                ))}
            </div>
        );
    }

    return null;
};

export function FinancialChart({ data }) {
    const { t } = useTranslation();
    const [range, setRange] = useState('ALL');

    const chartData = useMemo(() => {
        if (!Array.isArray(data) || data.length === 0) {
            return [];
        }

        const now = new Date();
        let cutoffDate = new Date('2000-01-01');

        if (range === '7D') {
            cutoffDate = new Date();
            cutoffDate.setDate(now.getDate() - 7);
        } else if (range === '30D') {
            cutoffDate = new Date();
            cutoffDate.setDate(now.getDate() - 30);
        }

        return data
            .filter((item) => new Date(item.date) >= cutoffDate)
            .map((item) => ({
                ...item,
                label: formatDateString(item.date, { day: '2-digit', month: '2-digit' }),
                income: Number(item.income || 0),
                expense: Number(item.expense || 0),
            }));
    }, [data, range]);

    return (
        <Card className="col-span-4 border-muted/40 shadow-md">
            <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                        <CardTitle className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-xl font-bold text-transparent dark:from-blue-400 dark:to-indigo-400">
                            {t('dashboard.chart.title')}
                        </CardTitle>
                        <CardDescription>{t('dashboard.chart.desc')}</CardDescription>
                    </div>
                    <div className="scrollbar-hidden -mx-1 overflow-x-auto px-1 pb-1 sm:mx-0 sm:px-0 sm:pb-0">
                        <div className="inline-flex min-w-full gap-1 rounded-lg bg-muted/50 p-1 sm:min-w-0">
                            {['7D', '30D', 'ALL'].map((item) => (
                                <button
                                    key={item}
                                    onClick={() => setRange(item)}
                                    className={`touch-target min-w-[88px] shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${range === item ? 'border border-border bg-background text-primary shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                                >
                                    {item}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="h-[280px] md:h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
                        <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" vertical={false} opacity={0.5} />
                        <XAxis dataKey="label" axisLine={false} fontSize={12} minTickGap={20} tick={{ fill: '#6b7280' }} tickLine={false} />
                        <YAxis
                            axisLine={false}
                            fontSize={12}
                            tick={{ fill: '#6b7280' }}
                            tickFormatter={(value) => `${value / 1000000}M`}
                            tickLine={false}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend iconType="circle" />
                        <Area
                            dataKey="income"
                            fill="url(#colorIncome)"
                            fillOpacity={1}
                            name={t('dashboard.stats.income')}
                            stroke="#10b981"
                            strokeWidth={3}
                            type="monotone"
                        />
                        <Area
                            dataKey="expense"
                            fill="url(#colorExpense)"
                            fillOpacity={1}
                            name={t('dashboard.stats.expense')}
                            stroke="#ef4444"
                            strokeWidth={3}
                            type="monotone"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
