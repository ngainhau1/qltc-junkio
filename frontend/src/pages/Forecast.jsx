import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    AlertTriangle,
    CheckCircle,
    Sparkles,
    TrendingDown,
    TrendingUp,
} from 'lucide-react';
import {
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

const forecastOptions = [3, 6, 12];

const formatMonthLabel = (value, locale) => {
    const date = new Date(`${value}-01T00:00:00.000Z`);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat(locale, {
        month: 'short',
        year: '2-digit',
    }).format(date);
};

export function Forecast() {
    const { t, i18n } = useTranslation();
    const [data, setData] = useState(null);
    const [months, setMonths] = useState(3);
    const [loading, setLoading] = useState(true);
    const locale = i18n.language?.startsWith('en') ? 'en-US' : 'vi-VN';

    useEffect(() => {
        let isActive = true;

        const fetchForecast = async () => {
            try {
                setLoading(true);
                const response = await api.get(`/forecast/ml?months=${months}`);

                if (isActive) {
                    setData(response.data);
                }
            } catch (error) {
                console.error('Forecast error:', error);
                if (isActive) {
                    setData(null);
                }
            } finally {
                if (isActive) {
                    setLoading(false);
                }
            }
        };

        void fetchForecast();

        return () => {
            isActive = false;
        };
    }, [months]);

    const historicalPoints = Array.isArray(data?.historical) ? data.historical : [];
    const forecastPoints = Array.isArray(data?.forecast) ? data.forecast : [];
    const chartData = [
        ...historicalPoints.map((entry) => ({
            month: formatMonthLabel(entry.month, locale),
            income: Number(entry.income) || 0,
            expense: Number(entry.expense) || 0,
            type: 'historical',
        })),
        ...forecastPoints.map((entry) => ({
            month: formatMonthLabel(entry.month, locale),
            income: Number(entry.predictedIncome) || 0,
            expense: Number(entry.predictedExpense) || 0,
            type: 'forecast',
        })),
    ];
    const firstForecastPoint = chartData.find((entry) => entry.type === 'forecast');

    return (
        <div className="space-y-6 p-4 md:p-6">
            <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                        {t('forecast.title')}
                    </h1>
                    <Badge variant="secondary" className="gap-1">
                        <Sparkles className="h-3.5 w-3.5" />
                        {t('forecast.aiBadge')}
                    </Badge>
                </div>
                <p className="text-muted-foreground">{t('forecast.desc')}</p>
                {data?.model ? (
                    <p className="text-sm text-muted-foreground">
                        {t('forecast.modelSummary', {
                            model: data.model.type,
                            count: data.model.sourceMonths,
                        })}
                    </p>
                ) : null}
            </div>

            {data?.warningMonth ? (
                <Card className="border-amber-500/50 bg-amber-500/5 p-4">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
                        <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                            {t('forecast.warningMsg', { month: data.warningMonth })}
                        </p>
                    </div>
                </Card>
            ) : data && !loading ? (
                <Card className="border-green-500/50 bg-green-500/5 p-4">
                    <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 shrink-0 text-green-500" />
                        <p className="text-sm font-medium text-green-700 dark:text-green-400">
                            {t('forecast.healthy')}
                        </p>
                    </div>
                </Card>
            ) : null}

            <div className="flex flex-wrap gap-2">
                {forecastOptions.map((option) => (
                    <button
                        key={option}
                        type="button"
                        onClick={() => setMonths(option)}
                        className={`touch-target flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors sm:flex-none ${
                            months === option
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                    >
                        {option} {t('forecast.monthsLabel')}
                    </button>
                ))}
            </div>

            <Card className="p-4 sm:p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold">{t('forecast.chartTitle')}</h2>
                    {data?.model ? (
                        <Badge variant="outline">
                            {t('forecast.modelLabel', { model: data.model.type })}
                        </Badge>
                    ) : null}
                </div>
                {loading ? (
                    <div className="flex h-72 items-center justify-center text-muted-foreground md:h-80">
                        {t('common.loading')}
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                            <XAxis dataKey="month" tick={{ fontSize: 11 }} minTickGap={20} />
                            <YAxis
                                tick={{ fontSize: 11 }}
                                tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                                width={56}
                            />
                            <Tooltip formatter={(value) => formatCurrency(value)} />
                            <Legend />
                            {firstForecastPoint ? (
                                <ReferenceLine
                                    x={firstForecastPoint.month}
                                    stroke="#888"
                                    strokeDasharray="5 5"
                                    label={t('forecast.predicted')}
                                />
                            ) : null}
                            <Line
                                type="monotone"
                                dataKey="income"
                                name={t('forecast.income')}
                                stroke="#22c55e"
                                strokeWidth={2}
                                dot={{ r: 4 }}
                            />
                            <Line
                                type="monotone"
                                dataKey="expense"
                                name={t('forecast.expense')}
                                stroke="#ef4444"
                                strokeWidth={2}
                                dot={{ r: 4 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </Card>

            {forecastPoints.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {forecastPoints.map((entry) => (
                        <Card key={entry.month} className="p-5">
                            <p className="mb-3 text-sm text-muted-foreground">{entry.month}</p>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-1 text-sm">
                                        <TrendingUp className="h-4 w-4 text-green-500" />
                                        {t('forecast.income')}
                                    </span>
                                    <span className="font-medium text-green-600">
                                        {formatCurrency(entry.predictedIncome)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-1 text-sm">
                                        <TrendingDown className="h-4 w-4 text-red-500" />
                                        {t('forecast.expense')}
                                    </span>
                                    <span className="font-medium text-red-600">
                                        {formatCurrency(entry.predictedExpense)}
                                    </span>
                                </div>
                                <hr />
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">
                                        {t('forecast.netFlow')}
                                    </span>
                                    <Badge
                                        variant={
                                            entry.predictedNet >= 0 ? 'default' : 'destructive'
                                        }
                                    >
                                        {formatCurrency(entry.predictedNet)}
                                    </Badge>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : null}
        </div>
    );
}
