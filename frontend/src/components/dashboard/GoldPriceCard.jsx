import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { ArrowDownRight, ArrowUpRight, Clock3, Coins, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchGoldPrice } from '@/features/market/goldPriceSlice';

const REFRESH_INTERVAL_MS = 60_000;

const vndFormatter = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
});

const formatGoldPrice = (value) => vndFormatter.format(Number(value || 0));

export function GoldPriceCard() {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const { data, loading, error } = useSelector((state) => state.goldPrice);

    useEffect(() => {
        dispatch(fetchGoldPrice());

        const intervalId = window.setInterval(() => {
            dispatch(fetchGoldPrice());
        }, REFRESH_INTERVAL_MS);

        return () => {
            window.clearInterval(intervalId);
        };
    }, [dispatch]);

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
            </CardContent>
        </Card>
    );
}
