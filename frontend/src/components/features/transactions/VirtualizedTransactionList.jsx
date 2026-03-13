import { useMemo, memo } from 'react';
import { formatCurrency, formatDateString } from "@/lib/utils";
import { ArrowUpRight, ArrowDownLeft, ChevronRight } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { useTranslation } from "react-i18next";

// Row Item Component
const TransactionRow = memo(({ item, onRowClick }) => {
    // Render Date Header
    if (item.type === 'HEADER') {
        return (
            <div className="bg-muted/20 px-4 py-2 font-medium text-sm flex items-center text-muted-foreground w-full sticky top-0 z-10">
                {item.date}
            </div>
        );
    }

    // Render Transaction Item
    const t = item.transaction;
    const isIncome = t.type === 'INCOME';

    return (
        <div className="px-4 w-full">
            <div
                className="flex items-center justify-between py-3 border-b h-full hover:bg-muted/50 transition-colors rounded-lg px-2 cursor-pointer group"
                onClick={() => onRowClick && onRowClick(t)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && onRowClick && onRowClick(t)}
                aria-label={`Xem chi tiết: ${t.description || 'Giao dịch'}`}
            >
                <div className="flex items-center gap-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full border ${isIncome ? 'bg-green-100 border-green-200' : 'bg-red-100 border-red-200'}`}>
                        {isIncome
                            ? <ArrowDownLeft className="h-5 w-5 text-green-600" />
                            : <ArrowUpRight className="h-5 w-5 text-red-600" />
                        }
                    </div>
                    <div>
                        <p className="font-medium truncate max-w-[200px]">{t.description || '—'}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                            {t.Category?.name || t.category_id || '—'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`font-semibold ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                        {isIncome ? '+' : '-'}{formatCurrency(t.amount)}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
                </div>
            </div>
        </div>
    );
});

TransactionRow.displayName = 'TransactionRow';

export function VirtualizedTransactionList({ transactions, onRowClick }) {
    const { t } = useTranslation();

    // Flatten Data: Convert grouped object to flat list with Headers
    const flatData = useMemo(() => {
        const groups = transactions.reduce((acc, transaction) => {
            const rawDate = transaction.date || transaction.transaction_date;
            if (!rawDate) return acc;

            try {
                const dateObj = new Date(rawDate);
                if (isNaN(dateObj.getTime())) return acc;

                const date = formatDateString(rawDate);
                if (!acc[date]) {
                    acc[date] = [];
                }
                acc[date].push(transaction);
            } catch (e) {
                console.error("Date parsing error", transaction, e);
            }
            return acc;
        }, {});

        const flattened = [];
        const sortedDates = Object.keys(groups).sort((a, b) => {
            const [d1, m1, y1] = a.split('/');
            const [d2, m2, y2] = b.split('/');
            return new Date(`${y2}-${m2}-${d2}`) - new Date(`${y1}-${m1}-${d1}`);
        });

        sortedDates.forEach(date => {
            flattened.push({ type: 'HEADER', date });
            groups[date].forEach(tx => {
                flattened.push({ type: 'ITEM', transaction: tx });
            });
        });
        return flattened;
    }, [transactions]);

    if (flatData.length === 0) {
        return (
            <div className="py-8">
                <EmptyState
                    title={t('transactions.list.emptyTitle')}
                    description={t('transactions.list.emptyDesc')}
                />
            </div>
        );
    }

    return (
        <div className="h-[600px] w-full border rounded-md bg-background overflow-y-auto">
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
