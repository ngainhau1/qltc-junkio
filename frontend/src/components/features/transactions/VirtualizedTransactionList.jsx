import { useMemo, memo } from 'react';
import { formatCurrency } from "@/lib/utils";
import { ArrowUpRight, ArrowDownLeft } from "lucide-react";

// Row Item Component (Adapted for standard list)
const TransactionRow = memo(({ item }) => {
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
    return (
        <div className="px-4 w-full">
            <div className="flex items-center justify-between py-3 border-b h-full hover:bg-muted/50 transition-colors rounded-lg px-2">
                <div className="flex items-center gap-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full border ${t.type === 'INCOME' ? 'bg-green-100 border-green-200' : 'bg-red-100 border-red-200'}`}>
                        {t.type === 'INCOME'
                            ? <ArrowDownLeft className={`h-5 w-5 ${t.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`} />
                            : <ArrowUpRight className={`h-5 w-5 ${t.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`} />
                        }
                    </div>
                    <div>
                        <p className="font-medium truncate max-w-[200px]">{t.description}</p>
                        <p className="text-xs text-muted-foreground capitalize">{t.category_id}</p>
                    </div>
                </div>
                <div className={`font-semibold ${t.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                    {t.type === 'INCOME' ? '+' : '-'}{formatCurrency(t.amount)}
                </div>
            </div>
        </div>
    );
});

export function VirtualizedTransactionList({ transactions }) {
    // 1. Flatten Data: Convert grouped object to flat list with Headers
    const flatData = useMemo(() => {
        const groups = transactions.reduce((acc, transaction) => {
            const rawDate = transaction.date || transaction.transaction_date;
            if (!rawDate) return acc; // Skip invalid transactions

            try {
                const dateObj = new Date(rawDate);
                if (isNaN(dateObj.getTime())) return acc; // Skip invalid dates

                const date = dateObj.toLocaleDateString('vi-VN');
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
        // Sort dates descending (newest first)
        const sortedDates = Object.keys(groups).sort((a, b) => {
            // Convert dd/mm/yyyy to yyyy-mm-dd for sorting
            const [d1, m1, y1] = a.split('/');
            const [d2, m2, y2] = b.split('/');
            return new Date(`${y2}-${m2}-${d2}`) - new Date(`${y1}-${m1}-${d1}`);
        });

        sortedDates.forEach(date => {
            flattened.push({ type: 'HEADER', date }); // Add Header
            groups[date].forEach(t => {
                flattened.push({ type: 'ITEM', transaction: t }); // Add Items
            });
        });
        return flattened;
    }, [transactions]);

    if (flatData.length === 0) {
        return <div className="text-center py-10 text-muted-foreground">Không tìm thấy giao dịch nào.</div>;
    }

    return (
        <div
            className="h-[600px] w-full border rounded-md bg-background overflow-y-auto"
        >
            {flatData.map((item) => (
                <TransactionRow
                    key={item.type === 'HEADER' ? `header-${item.date}` : `item-${item.transaction.id}`}
                    item={item}
                />
            ))}
        </div>
    );
}
