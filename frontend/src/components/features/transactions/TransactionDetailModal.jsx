import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDateString } from '@/lib/utils';
import { deleteTransaction, clearSelectedTransaction } from '@/features/transactions/transactionSlice';
import { Trash2, Wallet, Tag, Calendar, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function TransactionDetailModal({ isOpen, onClose }) {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const { selectedTransaction: tx, isDetailLoading } = useSelector(state => state.transactions);

    // Reset state khi đóng modal
    useEffect(() => {
        if (!isOpen) {
            dispatch(clearSelectedTransaction());
        }
    }, [isOpen, dispatch]);

    const handleDelete = async () => {
        if (!tx) return;
        if (!window.confirm(t('transactions.detail.confirmDelete', 'Bạn có chắc muốn xóa giao dịch này không?'))) return;
        await dispatch(deleteTransaction(tx.id));
        onClose();
    };

    const isIncome = tx?.type === 'INCOME';

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('transactions.detail.title', 'Chi tiết Giao dịch')}
        >
            {isDetailLoading && (
                <div className="flex justify-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
            )}

            {!isDetailLoading && tx && (
                <div className="space-y-6">
                    {/* Amount & Type */}
                    <div className="flex flex-col items-center gap-2 py-4">
                        <span className={`text-4xl font-bold ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                            {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                        </span>
                        <Badge
                            className={isIncome
                                ? 'bg-green-100 text-green-700 border-green-200'
                                : 'bg-red-100 text-red-700 border-red-200'}
                        >
                            {isIncome
                                ? t('transactions.type.income', 'Thu nhập')
                                : t('transactions.type.expense', 'Chi tiêu')}
                        </Badge>
                        {tx.description && (
                            <p className="text-center text-muted-foreground text-sm mt-1">{tx.description}</p>
                        )}
                    </div>

                    {/* Metadata */}
                    <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
                        {/* Date */}
                        <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2 text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                {t('transactions.detail.date', 'Ngày')}
                            </span>
                            <span className="font-medium">
                                {formatDateString(tx.date || tx.transaction_date)}
                            </span>
                        </div>

                        {/* Wallet */}
                        {tx.Wallet && (
                            <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-2 text-muted-foreground">
                                    <Wallet className="h-4 w-4" />
                                    {t('transactions.detail.wallet', 'Ví')}
                                </span>
                                <span className="font-medium">{tx.Wallet.name}</span>
                            </div>
                        )}

                        {/* Category */}
                        {tx.Category && (
                            <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-2 text-muted-foreground">
                                    <Tag className="h-4 w-4" />
                                    {t('transactions.detail.category', 'Danh mục')}
                                </span>
                                <span className="font-medium">{tx.Category.name}</span>
                            </div>
                        )}
                    </div>

                    {/* Shares */}
                    {tx.Shares && tx.Shares.length > 0 && (
                        <div className="space-y-2">
                            <p className="flex items-center gap-2 text-sm font-semibold">
                                <Users className="h-4 w-4" />
                                {t('transactions.detail.shares', 'Chia sẻ giao dịch')}
                            </p>
                            <div className="border rounded-lg overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            <th className="text-left px-3 py-2 font-medium">{t('transactions.detail.member', 'Thành viên')}</th>
                                            <th className="text-right px-3 py-2 font-medium">{t('transactions.detail.shareAmount', 'Số tiền')}</th>
                                            <th className="text-right px-3 py-2 font-medium">{t('transactions.detail.status', 'Trạng thái')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tx.Shares.map(share => (
                                            <tr key={share.id} className="border-t">
                                                <td className="px-3 py-2">
                                                    <p className="font-medium">{share.User?.name || '—'}</p>
                                                    <p className="text-xs text-muted-foreground">{share.User?.email}</p>
                                                </td>
                                                <td className="px-3 py-2 text-right font-medium">
                                                    {formatCurrency(share.amount)}
                                                </td>
                                                <td className="px-3 py-2 text-right">
                                                    <Badge
                                                        className={share.status === 'PAID'
                                                            ? 'bg-green-100 text-green-700 border-green-200 text-xs'
                                                            : 'bg-yellow-100 text-yellow-700 border-yellow-200 text-xs'}
                                                    >
                                                        {share.status === 'PAID'
                                                            ? t('transactions.detail.paid', 'Đã trả')
                                                            : t('transactions.detail.unpaid', 'Chưa trả')}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <Button variant="outline" className="flex-1" onClick={onClose}>
                            {t('common.close', 'Đóng')}
                        </Button>
                        <Button
                            variant="destructive"
                            className="flex-1"
                            onClick={handleDelete}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t('common.delete', 'Xóa')}
                        </Button>
                    </div>
                </div>
            )}
        </Modal>
    );
}
