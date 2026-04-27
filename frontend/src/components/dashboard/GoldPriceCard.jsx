import { startTransition, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
    ArrowDownRight,
    ArrowUpRight,
    ChartNoAxesCombined,
    Clock3,
    Coins,
    MapPin,
    TrendingDown,
    TrendingUp,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
    fetchGoldPrice,
    fetchGoldPriceHistory,
    GOLD_HISTORY_RANGE_OPTIONS,
    setGoldHistoryRange,
} from '@/features/market/goldPriceSlice';
import { GoldPriceMiniChart } from './GoldPriceMiniChart';

const CURRENT_REFRESH_INTERVAL_MS = 60_000;
const HISTORY_REFRESH_INTERVAL_MS = 5 * 60_000;

const vndFormatter = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
});

const formatGoldPrice = (value) => vndFormatter.format(Number(value || 0));
const formatSignedPrice = (value) => `${Number(value || 0) >= 0 ? '+' : '-'}${formatGoldPrice(Math.abs(Number(value || 0)))}`;
const formatSignedPercent = (value) => `${Number(value || 0) >= 0 ? '+' : '-'}${Math.abs(Number(value || 0)).toFixed(2)}%`;

const getTrendConfig = (changeValue) => {
    if (changeValue > 0) {
        return {
            color: '#059669',
            badgeClassName: 'border-emerald-300/70 bg-emerald-500/10 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300',
            icon: TrendingUp,
        };
    }

    if (changeValue < 0) {
        return {
            color: '#e11d48',
            badgeClassName: 'border-rose-300/70 bg-rose-500/10 text-rose-700 dark:border-rose-800 dark:bg-rose-500/10 dark:text-rose-300',
            icon: TrendingDown,
        };
    }

    return {
        color: '#d97706',
        badgeClassName: 'border-amber-300/70 bg-amber-500/10 text-amber-700 dark:border-amber-800 dark:bg-amber-500/10 dark:text-amber-200',
        icon: ChartNoAxesCombined,
    };
};

export function GoldPriceCard() {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const {
        data,
        loading,
        error,
        selectedRange,
        historyByRange,
    } = useSelector((state) => state.goldPrice);
    const historyState = historyByRange[selectedRange];
    const historyData = historyState?.data;
    const historyPoints = historyData?.points || [];
    const historySummary = historyData?.summary;
    const trendConfig = getTrendConfig(historySummary?.absoluteChangeSell || 0);
    const TrendIcon = trendConfig.icon;

    useEffect(() => {
        dispatch(fetchGoldPrice());

        const intervalId = window.setInterval(() => {
            dispatch(fetchGoldPrice());
        }, CURRENT_REFRESH_INTERVAL_MS);

        return () => {
            window.clearInterval(intervalId);
        };
    }, [dispatch]);

    useEffect(() => {
        dispatch(fetchGoldPriceHistory({ range: selectedRange }));

        const intervalId = window.setInterval(() => {
            dispatch(fetchGoldPriceHistory({ range: selectedRange, force: true }));
        }, HISTORY_REFRESH_INTERVAL_MS);

        return () => {
            window.clearInterval(intervalId);
        };
    }, [dispatch, selectedRange]);

    if (!data && loading) {
        return (
            <Card className="border-amber-200/70 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-100 shadow-md dark:border-amber-900/40 dark:from-amber-950/40 dark:via-orange-950/20 dark:to-background">
                <CardContent className="flex min-h-[220px] flex-col items-center justify-center gap-3 p-6 text-center">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                        {t('marketGold.loading')}
                    </p>
                </CardContent>
            </Card>
        );
    }

    if (!data || error) {
        return (
            <Card className="border-amber-200/70 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-100 shadow-md dark:border-amber-900/40 dark:from-amber-950/40 dark:via-orange-950/20 dark:to-background">
                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <CardTitle className="flex items-center gap-2 text-xl text-amber-950 dark:text-amber-50">
                                <Coins className="h-5 w-5 text-amber-600 dark:text-amber-300" />
                                {t('marketGold.title')}
                            </CardTitle>
                            <CardDescription>{t('marketGold.description')}</CardDescription>
                        </div>
                        <Badge
                            variant="outline"
                            className="border-amber-300/80 bg-white/70 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
                        >
                            SJC
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    <p className="text-sm font-medium text-foreground">{t('marketGold.unavailable')}</p>
                    <p className="text-sm text-muted-foreground">{t('marketGold.unavailableDesc')}</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="overflow-hidden border-amber-200/70 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-100 shadow-md dark:border-amber-900/40 dark:from-amber-950/40 dark:via-orange-950/20 dark:to-background">
            <CardHeader className="pb-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0 space-y-2">
                        <CardTitle className="flex items-center gap-2 text-xl text-amber-950 dark:text-amber-50">
                            <Coins className="h-5 w-5 text-amber-600 dark:text-amber-300" />
                            {t('marketGold.title')}
                        </CardTitle>
                        <CardDescription>{t('marketGold.description')}</CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge
                            variant="outline"
                            className="border-amber-300/80 bg-white/70 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
                        >
                            {t('marketGold.sourceLabel', { value: String(data.source || 'SJC').toUpperCase() })}
                        </Badge>
                        <Badge
                            variant="secondary"
                            className="bg-amber-500/15 text-amber-900 dark:bg-amber-500/10 dark:text-amber-100"
                        >
                            {loading ? t('marketGold.refreshing') : t('marketGold.autoRefresh')}
                        </Badge>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="space-y-3 rounded-xl border border-amber-200/80 bg-white/70 p-4 shadow-sm dark:border-amber-900/50 dark:bg-background/40">
                        <div className="space-y-1">
                            <p className="text-xs font-medium uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300">
                                {t('marketGold.product')}
                            </p>
                            <p className="text-lg font-semibold text-foreground">{data.productName}</p>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4 text-amber-600 dark:text-amber-300" />
                            <span>{t('marketGold.branchLabel', { value: data.branch })}</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock3 className="h-4 w-4 text-amber-600 dark:text-amber-300" />
                            <span>
                                {t('marketGold.updatedLabel', {
                                    value: data.updatedLabel || t('common.unknown'),
                                })}
                            </span>
                        </div>

                        <p className="text-xs text-muted-foreground">{t('marketGold.unitValue')}</p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                        <div className="rounded-xl border border-emerald-200 bg-emerald-500/10 p-4 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-500/5">
                            <div className="mb-3 flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                                <ArrowDownRight className="h-4 w-4" />
                                <span className="text-sm font-semibold">{t('marketGold.buy')}</span>
                            </div>
                            <p className="text-2xl font-bold tracking-tight text-emerald-700 dark:text-emerald-300">
                                {formatGoldPrice(data.buy)}
                            </p>
                        </div>

                        <div className="rounded-xl border border-rose-200 bg-rose-500/10 p-4 shadow-sm dark:border-rose-900/40 dark:bg-rose-500/5">
                            <div className="mb-3 flex items-center gap-2 text-rose-700 dark:text-rose-300">
                                <ArrowUpRight className="h-4 w-4" />
                                <span className="text-sm font-semibold">{t('marketGold.sell')}</span>
                            </div>
                            <p className="text-2xl font-bold tracking-tight text-rose-700 dark:text-rose-300">
                                {formatGoldPrice(data.sell)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-amber-200/80 bg-white/70 p-4 shadow-sm dark:border-amber-900/50 dark:bg-background/40">
                    <div className="flex flex-col gap-3 border-b border-amber-200/70 pb-4 dark:border-amber-900/40 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                <TrendIcon className="h-4 w-4" style={{ color: trendConfig.color }} />
                                <span>{t('marketGold.trendLabel')}</span>
                            </div>
                            {historySummary ? (
                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge className={cn('border text-sm font-semibold', trendConfig.badgeClassName)} variant="outline">
                                        {formatSignedPrice(historySummary.absoluteChangeSell)}
                                    </Badge>
                                    <span className="text-sm font-medium text-muted-foreground">
                                        {formatSignedPercent(historySummary.percentChangeSell)} {t('marketGold.vsRangeStart')}
                                    </span>
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">{t('marketGold.vsRangeStart')}</p>
                            )}
                        </div>

                        <div className="inline-flex w-fit rounded-lg bg-amber-500/10 p-1">
                            {GOLD_HISTORY_RANGE_OPTIONS.map((range) => (
                                <button
                                    key={range}
                                    type="button"
                                    className={cn(
                                        'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                                        selectedRange === range
                                            ? 'bg-white text-amber-900 shadow-sm dark:bg-background dark:text-amber-100'
                                            : 'text-amber-700 hover:bg-white/60 dark:text-amber-200 dark:hover:bg-background/70'
                                    )}
                                    onClick={() => {
                                        startTransition(() => {
                                            dispatch(setGoldHistoryRange(range));
                                        });
                                    }}
                                >
                                    {range === '24H' ? t('marketGold.range24h') : t('marketGold.range7d')}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4">
                        {historyState.loading && !historyData ? (
                            <div className="flex h-[180px] items-center justify-center rounded-xl border border-dashed border-amber-300/70 bg-amber-50/60 text-sm font-medium text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-100">
                                {t('marketGold.loading')}
                            </div>
                        ) : historyState.error || !historyData ? (
                            <div
                                className="flex h-[180px] flex-col items-center justify-center rounded-xl border border-dashed border-rose-300/70 bg-rose-50/60 px-4 text-center dark:border-rose-900/50 dark:bg-rose-950/20"
                                data-testid="gold-history-unavailable"
                            >
                                <p className="text-sm font-semibold text-rose-700 dark:text-rose-200">
                                    {t('marketGold.historyUnavailable')}
                                </p>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    {t('marketGold.historyUnavailableDesc')}
                                </p>
                            </div>
                        ) : historyPoints.length < 2 ? (
                            <div
                                className="flex h-[180px] flex-col items-center justify-center rounded-xl border border-dashed border-amber-300/70 bg-amber-50/60 px-4 text-center dark:border-amber-900/60 dark:bg-amber-950/20"
                                data-testid="gold-history-accumulating"
                            >
                                <p className="text-sm font-semibold text-amber-800 dark:text-amber-100">
                                    {t('marketGold.historyAccumulating')}
                                </p>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    {t('marketGold.historyAccumulatingDesc')}
                                </p>
                            </div>
                        ) : (
                            <GoldPriceMiniChart
                                color={trendConfig.color}
                                points={historyPoints}
                                range={selectedRange}
                            />
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
