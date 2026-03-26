import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatDateString } from '@/lib/utils';
import { ArrowDownLeft, ArrowRightLeft, ArrowUpRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function RecentTransactions({ transactions }) {
    const { t } = useTranslation();
    const recentTransactions = Array.isArray(transactions) ? transactions.slice(0, 5) : [];

    return (
        <Card className="col-span-1 h-full border-muted/40 shadow-md">
            <CardHeader>
                <CardTitle className="text-xl font-bold">{t('dashboard.recent.title')}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {recentTransactions.map((transaction) => {
                        const isTransfer = transaction.type === 'TRANSFER_IN' || transaction.type === 'TRANSFER_OUT';
                        const isIncome = transaction.type === 'INCOME' || transaction.type === 'TRANSFER_IN';
                        const transactionDate = transaction.date || transaction.transaction_date || transaction.createdAt;
                        const toneClasses = isTransfer
                            ? 'border-sky-200 bg-sky-100'
                            : isIncome
                                ? 'border-emerald-200 bg-emerald-100'
                                : 'border-rose-200 bg-rose-100';
                        const amountClasses = isTransfer
                            ? 'text-sky-600'
                            : isIncome
                                ? 'text-emerald-600'
                                : 'text-rose-600';

                        return (
                            <div
                                key={transaction.id}
                                className="group -mx-2 flex cursor-pointer items-start gap-3 rounded-lg p-2 transition-colors hover:bg-muted/30 sm:items-center"
                            >
                                <div className={`flex h-10 w-10 items-center justify-center rounded-full border ${toneClasses}`}>
                                    {isTransfer ? (
                                        <ArrowRightLeft className="h-5 w-5 text-sky-600" />
                                    ) : isIncome ? (
                                        <ArrowDownLeft className="h-5 w-5 text-emerald-600" />
                                    ) : (
                                        <ArrowUpRight className="h-5 w-5 text-rose-600" />
                                    )}
                                </div>
                                <div className="min-w-0 flex-1 space-y-1">
                                    <p className="truncate text-sm font-medium leading-none">{transaction.description}</p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {transactionDate ? formatDateString(transactionDate) : '-'}
                                    </p>
                                </div>
                                <div className={`shrink-0 text-sm font-semibold ${amountClasses}`}>
                                    {isIncome ? '+' : '-'}
                                    {formatCurrency(transaction.amount)}
                                </div>
                            </div>
                        );
                    })}

                    {recentTransactions.length === 0 && (
                        <p className="text-sm text-muted-foreground">{t('transactions.list.emptyDesc')}</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
