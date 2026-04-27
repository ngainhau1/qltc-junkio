import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowDownLeft, ArrowRightLeft, ArrowUpRight, ChevronRight } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { localizeCategoryName } from '@/features/categories/categoryLocalization';
import {
    formatCurrency,
    formatDateString,
    getTransactionAmountMeta,
    getTransactionTypeLabel
} from '@/lib/utils';

const TransactionRow = memo(({ item, onRowClick }) => {
    const { t } = useTranslation();

    if (item.type === 'HEADER') {
        return (
            <div className="sticky top-0 z-10 flex w-full items-center border-b bg-background/95 px-4 py-2 text-sm font-medium text-muted-foreground backdrop-blur-md">
                {item.date}
            </div>
        );
    }

    const transaction = item.transaction;
    const isTransfer = transaction.type === 'TRANSFER_IN' || transaction.type === 'TRANSFER_OUT';
    const isIncome = transaction.type === 'INCOME' || transaction.type === 'TRANSFER_IN';
    const amountMeta = getTransactionAmountMeta(transaction.type);
    const secondaryText = isTransfer
        ? getTransactionTypeLabel(transaction.type, t)
        : localizeCategoryName(transaction.Category?.name, t) || transaction.category_id || '-';
    const displayDescription = transaction.description || '';
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
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${amountMeta.iconToneClassName}`}>
                        {isTransfer ? (
                            <ArrowRightLeft className={`h-5 w-5 ${amountMeta.iconClassName}`} />
                        ) : isIncome ? (
                            <ArrowDownLeft className={`h-5 w-5 ${amountMeta.iconClassName}`} />
                        ) : (
                            <ArrowUpRight className={`h-5 w-5 ${amountMeta.iconClassName}`} />
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{displayDescription || '-'}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                            <span className="capitalize">{secondaryText}</span>
                            <span className="hidden sm:inline">•</span>
                            <span>{transactionDate ? formatDateString(transactionDate) : '-'}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center justify-between gap-2 sm:justify-end">
                    <span className={`font-semibold ${amountMeta.amountClassName}`}>
                        {amountMeta.sign}
                        {formatCurrency(transaction.amount)}
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-colors group-hover:text-muted-foreground" />
                </div>
            </div>
        </div>
    );
});

TransactionRow.displayName = 'TransactionRow';

export function VirtualizedTransactionList({ transactions, onRowClick, groupByDate = true }) {
    const { t } = useTranslation();

    const flatData = useMemo(() => {
        const flattened = [];
        let lastDate = null;

        transactions.forEach((transaction) => {
            const rawDate = transaction.date || transaction.transaction_date;
            if (!rawDate) return;

            if (groupByDate) {
                const dateStr = formatDateString(rawDate);
                if (dateStr !== lastDate) {
                    flattened.push({ type: 'HEADER', date: dateStr });
                    lastDate = dateStr;
                }
            }
            
            flattened.push({ type: 'ITEM', transaction });
        });

        return flattened;
    }, [transactions, groupByDate]);

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
