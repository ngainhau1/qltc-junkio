import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchTransactionById,
    fetchTransactions,
    setCurrentPage,
    setFilter,
} from '@/features/transactions/transactionSlice';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { History, Plus, Repeat } from 'lucide-react';
import { RecurringRulesList } from '@/components/features/recurring/RecurringRulesList';
import { RecurringRuleForm } from '@/components/features/recurring/RecurringRuleForm';
import { Modal } from '@/components/ui/modal';
import { VirtualizedTransactionList } from '@/components/features/transactions/VirtualizedTransactionList';
import { TransactionDetailModal } from '@/components/features/transactions/TransactionDetailModal';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileSpreadsheet, FileText, Upload } from 'lucide-react';
import {
    exportTransactionRowsToCSV,
    exportTransactionRowsToExcel,
    exportTransactionRowsToPDF,
    fetchAllTransactionsForExport,
} from '@/services/exportService';
import { useTranslation } from 'react-i18next';
import { closeImportModal, openImportModal } from '@/features/ui/uiSlice';
import { ImportTransactionsModal } from '@/components/features/transactions/ImportTransactionsModal';
import { buildTransactionQueryFromState } from '@/features/finance/context';
import { toast } from 'sonner';

export function Transactions() {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const { transactions, pagination, filter, loading } = useSelector((state) => state.transactions);
    const { activeFamilyId } = useSelector((state) => state.families);
    const { isImportModalOpen } = useSelector((state) => state.ui);
    const [activeTab, setActiveTab] = useState('history');
    const [isAddRuleOpen, setIsAddRuleOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    const handleRowClick = useCallback(
        (transaction) => {
            dispatch(fetchTransactionById(transaction.id));
            setIsDetailOpen(true);
        },
        [dispatch]
    );

    useEffect(() => {
        dispatch(setCurrentPage(1));
    }, [dispatch, activeFamilyId]);

    useEffect(() => {
        if (activeTab !== 'history') {
            return undefined;
        }

        const timer = setTimeout(() => {
            dispatch(fetchTransactions());
        }, 350);

        return () => clearTimeout(timer);
    }, [
        activeTab,
        activeFamilyId,
        dispatch,
        filter.categoryId,
        filter.endDate,
        filter.search,
        filter.startDate,
        filter.type,
        filter.walletId,
        pagination.currentPage,
        pagination.itemsPerPage,
    ]);

    const handleExport = async (format) => {
        try {
            const query = buildTransactionQueryFromState({
                transactions: {
                    filter,
                    pagination,
                },
                families: { activeFamilyId },
            });
            const allTransactions = await fetchAllTransactionsForExport(query);

            if (format === 'pdf') {
                await exportTransactionRowsToPDF(allTransactions, t('reports.exportTitle'));
                return;
            }

            if (format === 'csv') {
                exportTransactionRowsToCSV(allTransactions);
                return;
            }

            await exportTransactionRowsToExcel(allTransactions);
        } catch (error) {
            toast.error(error?.message || t('transactions.exportError'));
        }
    };

    return (
        <div className="space-y-6">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('transactions.title')}</h1>
                    <p className="text-muted-foreground">{t('transactions.desc')}</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        className="border-blue-200 text-blue-600 hover:bg-blue-50"
                        onClick={() => dispatch(openImportModal())}
                    >
                        <Upload className="mr-2 h-4 w-4" /> {t('transactions.import.submit')}
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                                <Download className="mr-2 h-4 w-4" /> {t('transactions.exportData')}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleExport('pdf')}>
                                <FileText className="mr-2 h-4 w-4" /> {t('transactions.exportPDF')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExport('csv')}>
                                <FileSpreadsheet className="mr-2 h-4 w-4" /> {t('transactions.exportCSV')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExport('xlsx')}>
                                <FileSpreadsheet className="mr-2 h-4 w-4" /> {t('transactions.exportExcel')}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {activeTab === 'recurring' && (
                        <Button onClick={() => setIsAddRuleOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" /> {t('transactions.addSchedule')}
                        </Button>
                    )}
                </div>
            </header>

            <div className="flex w-fit rounded-lg bg-muted p-1">
                <button
                    onClick={() => setActiveTab('history')}
                    className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${activeTab === 'history' ? 'border border-border bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    <History className="h-4 w-4" /> {t('transactions.tabs.history')}
                </button>
                <button
                    onClick={() => setActiveTab('recurring')}
                    className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${activeTab === 'recurring' ? 'border border-border bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    <Repeat className="h-4 w-4" /> {t('transactions.tabs.recurring')}
                </button>
            </div>

            {activeTab === 'history' ? (
                <>
                    <div className="flex gap-4">
                        <Input
                            placeholder={t('transactions.search')}
                            className="max-w-xs"
                            value={filter.search}
                            onChange={(event) => dispatch(setFilter({ search: event.target.value }))}
                        />
                    </div>

                    <div className="space-y-6">
                        {loading ? (
                            <div className="flex min-h-[320px] items-center justify-center rounded-xl border bg-card">
                                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                            </div>
                        ) : (
                            <VirtualizedTransactionList transactions={transactions} onRowClick={handleRowClick} />
                        )}

                        {pagination.totalPages > 1 && (
                            <div className="mt-6 flex items-center justify-center gap-4">
                                <Button
                                    variant="outline"
                                    onClick={() => dispatch(setCurrentPage(Math.max(1, pagination.currentPage - 1)))}
                                    disabled={pagination.currentPage === 1}
                                >
                                    {t('common.prev')}
                                </Button>
                                <span className="text-sm">
                                    {t('common.page')} {pagination.currentPage} / {pagination.totalPages} (Tổng: {pagination.totalItems})
                                </span>
                                <Button
                                    variant="outline"
                                    onClick={() => dispatch(setCurrentPage(Math.min(pagination.totalPages, pagination.currentPage + 1)))}
                                    disabled={pagination.currentPage === pagination.totalPages}
                                >
                                    {t('common.next')}
                                </Button>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <RecurringRulesList />
            )}

            <Modal isOpen={isAddRuleOpen} onClose={() => setIsAddRuleOpen(false)} title={t('transactions.addRecurringTitle')}>
                <RecurringRuleForm onSuccess={() => setIsAddRuleOpen(false)} />
            </Modal>

            <ImportTransactionsModal isOpen={isImportModalOpen} onClose={() => dispatch(closeImportModal())} />

            <TransactionDetailModal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} />
        </div>
    );
}
