import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowDownLeft, ArrowRightLeft, ArrowUpRight, ChevronRight } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { formatCurrency, formatDateString } from '@/lib/utils';

const TransactionRow = memo(({ item, onRowClick }) => {
    const { t } = useTranslation();

    if (item.type === 'HEADER') {
        return (
            <div className="sticky top-0 z-10 flex w-full items-center bg-muted/20 px-4 py-2 text-sm font-medium text-muted-foreground">
                {item.date}
            </div>
        );
    }

    const transaction = item.transaction;
    const isTransfer = transaction.type === 'TRANSFER_IN' || transaction.type === 'TRANSFER_OUT';
    const isIncome = transaction.type === 'INCOME' || transaction.type === 'TRANSFER_IN';
    const toneClasses = isTransfer
        ? 'border-sky-200 bg-sky-100'
        : isIncome
            ? 'border-green-200 bg-green-100'
            : 'border-red-200 bg-red-100';
    const amountClasses = isTransfer
        ? 'text-sky-600'
        : isIncome
            ? 'text-green-600'
            : 'text-red-600';
    const secondaryText = isTransfer
        ? t('transactionForm.tabs.transfer')
        : transaction.Category?.name || transaction.category_id || '-';
    const transactionDate = transaction.date || transaction.transaction_date;

    return (
        <div className="w-full px-3 sm:px-4">
            <div
                className="group flex h-full cursor-pointer flex-col gap-3 rounded-lg border-b px-2 py-3 transition-colors hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between"
                onClick={() => onRowClick && onRowClick(transaction)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => event.key === 'Enter' && onRowClick && onRowClick(transaction)}
                aria-label={`View details: ${transaction.description || 'Transaction'}`}
            >
                <div className="flex min-w-0 items-start gap-3 sm:items-center">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${toneClasses}`}>
                        {isTransfer ? (
                            <ArrowRightLeft className="h-5 w-5 text-sky-600" />
                        ) : isIncome ? (
                            <ArrowDownLeft className="h-5 w-5 text-green-600" />
                        ) : (
                            <ArrowUpRight className="h-5 w-5 text-red-600" />
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{transaction.description || '-'}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                            <span className="capitalize">{secondaryText}</span>
                            <span className="hidden sm:inline">•</span>
                            <span>{transactionDate ? formatDateString(transactionDate) : '-'}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center justify-between gap-2 sm:justify-end">
                    <span className={`font-semibold ${amountClasses}`}>
                        {isIncome ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-colors group-hover:text-muted-foreground" />
                </div>
            </div>
        </div>
    );
});

TransactionRow.displayName = 'TransactionRow';

export function VirtualizedTransactionList({ transactions, onRowClick }) {
    const { t } = useTranslation();

    const flatData = useMemo(() => {
        const groups = transactions.reduce((accumulator, transaction) => {
            const rawDate = transaction.date || transaction.transaction_date;
            if (!rawDate) {
                return accumulator;
            }

            const dateObject = new Date(rawDate);
            if (Number.isNaN(dateObject.getTime())) {
                return accumulator;
            }

            const formattedDate = formatDateString(rawDate);
            if (!accumulator[formattedDate]) {
                accumulator[formattedDate] = [];
            }

            accumulator[formattedDate].push(transaction);
            return accumulator;
        }, {});

        const flattened = [];
        const sortedDates = Object.keys(groups).sort((left, right) => {
            const [leftDay, leftMonth, leftYear] = left.split('/');
            const [rightDay, rightMonth, rightYear] = right.split('/');
            return new Date(`${rightYear}-${rightMonth}-${rightDay}`) - new Date(`${leftYear}-${leftMonth}-${leftDay}`);
        });

        sortedDates.forEach((date) => {
            flattened.push({ type: 'HEADER', date });
            groups[date].forEach((transaction) => {
                flattened.push({ type: 'ITEM', transaction });
            });
        });

        return flattened;
    }, [transactions]);

    if (flatData.length === 0) {
        return (
            <div className="py-8">
                <EmptyState title={t('transactions.list.emptyTitle')} description={t('transactions.list.emptyDesc')} />
            </div>
        );
    }

    return (
        <div className="max-h-[70dvh] w-full overflow-y-auto rounded-md border bg-background md:h-[600px]">
            {flatData.map((item) => (
                <TransactionRow
                    key={item.type === 'HEADER' ? `header-${item.date}` : `item-${item.transaction.id}`}
                    item={item}
                    onRowClick={onRowClick}
                />
            ))}
        </div>
    );
}
