import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDateString } from '@/lib/utils';
import { clearSelectedTransaction, deleteTransaction } from '@/features/transactions/transactionSlice';
import { refreshFinanceData } from '@/features/finance/refreshFinanceData';
import { Calendar, Tag, Trash2, Users, Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TableSwitch } from '@/components/ui/table-switch';

export function TransactionDetailModal({ isOpen, onClose }) {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const { selectedTransaction: tx, isDetailLoading } = useSelector((state) => state.transactions);
    const isTransfer = tx?.type === 'TRANSFER_IN' || tx?.type === 'TRANSFER_OUT';
    const isIncome = tx?.type === 'INCOME' || tx?.type === 'TRANSFER_IN';
    const amountTone = isTransfer ? 'text-sky-600' : isIncome ? 'text-green-600' : 'text-red-600';
    const badgeTone = isTransfer
        ? 'border-sky-200 bg-sky-100 text-sky-700'
        : isIncome
            ? 'border-green-200 bg-green-100 text-green-700'
            : 'border-red-200 bg-red-100 text-red-700';
    const badgeLabel = isTransfer
        ? t('transactionForm.tabs.transfer')
        : isIncome
            ? t('transactions.type.income')
            : t('transactions.type.expense');

    useEffect(() => {
        if (!isOpen) {
            dispatch(clearSelectedTransaction());
        }
    }, [dispatch, isOpen]);

    const handleDelete = async () => {
        if (!tx) {
            return;
        }

        if (!window.confirm(t('transactions.detail.confirmDelete'))) {
            return;
        }

        await dispatch(deleteTransaction(tx.id)).unwrap();
        await dispatch(refreshFinanceData());
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('transactions.detail.title')}>
            {isDetailLoading && (
                <div className="flex justify-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
            )}

            {!isDetailLoading && tx && (
                <div className="space-y-6">
                    <div className="flex flex-col items-center gap-2 py-4">
                        <span className={`text-4xl font-bold ${amountTone}`}>
                            {isIncome ? '+' : '-'}
                            {formatCurrency(tx.amount)}
                        </span>
                        <Badge className={badgeTone}>
                            {badgeLabel}
                        </Badge>
                        {tx.description && <p className="mt-1 text-center text-sm text-muted-foreground">{tx.description}</p>}
                    </div>

                    <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
                        <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
                            <span className="flex items-center gap-2 text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                {t('transactions.detail.date')}
                            </span>
                            <span className="font-medium">{formatDateString(tx.date || tx.transaction_date)}</span>
                        </div>

                        {tx.Wallet && (
                            <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
                                <span className="flex items-center gap-2 text-muted-foreground">
                                    <Wallet className="h-4 w-4" />
                                    {t('transactions.detail.wallet')}
                                </span>
                                <span className="font-medium">{tx.Wallet.name}</span>
                            </div>
                        )}

                        {tx.Category && (
                            <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
                                <span className="flex items-center gap-2 text-muted-foreground">
                                    <Tag className="h-4 w-4" />
                                    {t('transactions.detail.category')}
                                </span>
                                <span className="font-medium">{tx.Category.name}</span>
                            </div>
                        )}
                    </div>

                    {tx.Shares && tx.Shares.length > 0 && (
                        <div className="space-y-2">
                            <p className="flex items-center gap-2 text-sm font-semibold">
                                <Users className="h-4 w-4" />
                                {t('transactions.detail.shares')}
                            </p>
                            <TableSwitch
                                mobile={
                                    <div className="space-y-3">
                                        {tx.Shares.map((share) => (
                                            <div key={share.id} className="rounded-lg border p-3">
                                                <p className="font-medium">{share.User?.name || '?'}</p>
                                                <p className="text-xs text-muted-foreground">{share.User?.email}</p>
                                                <div className="mt-3 flex items-center justify-between gap-2">
                                                    <span className="text-sm font-medium">{formatCurrency(share.amount)}</span>
                                                    <Badge className={share.status === 'PAID' ? 'border-green-200 bg-green-100 text-xs text-green-700' : 'border-yellow-200 bg-yellow-100 text-xs text-yellow-700'}>
                                                        {share.status === 'PAID' ? t('transactions.detail.paid') : t('transactions.detail.unpaid')}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                }
                                desktop={
                                    <div className="overflow-hidden rounded-lg border">
                                        <table className="w-full text-sm">
                                            <thead className="bg-muted/50">
                                                <tr>
                                                    <th className="px-3 py-2 text-left font-medium">{t('transactions.detail.member')}</th>
                                                    <th className="px-3 py-2 text-right font-medium">{t('transactions.detail.shareAmount')}</th>
                                                    <th className="px-3 py-2 text-right font-medium">{t('transactions.detail.status')}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {tx.Shares.map((share) => (
                                                    <tr key={share.id} className="border-t">
                                                        <td className="px-3 py-2">
                                                            <p className="font-medium">{share.User?.name || '?'}</p>
                                                            <p className="text-xs text-muted-foreground">{share.User?.email}</p>
                                                        </td>
                                                        <td className="px-3 py-2 text-right font-medium">{formatCurrency(share.amount)}</td>
                                                        <td className="px-3 py-2 text-right">
                                                            <Badge className={share.status === 'PAID' ? 'border-green-200 bg-green-100 text-xs text-green-700' : 'border-yellow-200 bg-yellow-100 text-xs text-yellow-700'}>
                                                                {share.status === 'PAID' ? t('transactions.detail.paid') : t('transactions.detail.unpaid')}
                                                            </Badge>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                }
                            />
                        </div>
                    )}

                    <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row">
                        <Button variant="outline" className="flex-1" onClick={onClose}>
                            {t('common.close')}
                        </Button>
                        <Button variant="destructive" className="flex-1" onClick={handleDelete}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t('common.delete')}
                        </Button>
                    </div>
                </div>
            )}
        </Modal>
    );
}
