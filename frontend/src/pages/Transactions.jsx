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
import {
    Download,
    FileSpreadsheet,
    FileText,
    History,
    MoreHorizontal,
    Plus,
    Repeat,
    Upload,
} from 'lucide-react';
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
import { PageHeader } from '@/components/layout/PageHeader';
import { ResponsiveActions } from '@/components/layout/ResponsiveActions';
import { ResponsiveTabs } from '@/components/ui/responsive-tabs';

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

    const desktopActions = (
        <>
            <Button
                variant="outline"
                className="touch-target border-blue-200 text-blue-600 hover:bg-blue-50"
                onClick={() => dispatch(openImportModal())}
            >
                <Upload className="mr-2 h-4 w-4" /> {t('transactions.import.submit')}
            </Button>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="touch-target">
                        <Download className="mr-2 h-4 w-4" /> {t('transactions.exportData')}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
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
                <Button onClick={() => setIsAddRuleOpen(true)} className="touch-target">
                    <Plus className="mr-2 h-4 w-4" /> {t('transactions.addSchedule')}
                </Button>
            )}
        </>
    );

    const mobileActions = (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="touch-target w-full justify-between">
                    <span>{t('nav.menu')}</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuItem onClick={() => dispatch(openImportModal())}>
                    <Upload className="mr-2 h-4 w-4" /> {t('transactions.import.submit')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('pdf')}>
                    <FileText className="mr-2 h-4 w-4" /> {t('transactions.exportPDF')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('csv')}>
                    <FileSpreadsheet className="mr-2 h-4 w-4" /> {t('transactions.exportCSV')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('xlsx')}>
                    <FileSpreadsheet className="mr-2 h-4 w-4" /> {t('transactions.exportExcel')}
                </DropdownMenuItem>
                {activeTab === 'recurring' && (
                    <DropdownMenuItem onClick={() => setIsAddRuleOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> {t('transactions.addSchedule')}
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );

    return (
        <div className="space-y-6">
            <PageHeader
                title={t('transactions.title')}
                description={t('transactions.desc')}
                actions={<ResponsiveActions desktop={desktopActions} mobile={mobileActions} />}
            />

            <ResponsiveTabs
                items={[
                    { value: 'history', label: t('transactions.tabs.history'), icon: History },
                    { value: 'recurring', label: t('transactions.tabs.recurring'), icon: Repeat },
                ]}
                value={activeTab}
                onChange={setActiveTab}
            />

            {activeTab === 'history' ? (
                <>
                    <div className="flex flex-col gap-4 sm:flex-row">
                        <Input
                            placeholder={t('transactions.search')}
                            className="w-full sm:max-w-sm"
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
                            <div className="mt-6 flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-center sm:text-left">
                                <Button
                                    variant="outline"
                                    onClick={() => dispatch(setCurrentPage(Math.max(1, pagination.currentPage - 1)))}
                                    disabled={pagination.currentPage === 1}
                                    className="touch-target w-full sm:w-auto"
                                >
                                    {t('common.prev')}
                                </Button>
                                <span className="text-sm leading-relaxed">
                                    {t('common.page')} {pagination.currentPage} / {pagination.totalPages} (Tong: {pagination.totalItems})
                                </span>
                                <Button
                                    variant="outline"
                                    onClick={() => dispatch(setCurrentPage(Math.min(pagination.totalPages, pagination.currentPage + 1)))}
                                    disabled={pagination.currentPage === pagination.totalPages}
                                    className="touch-target w-full sm:w-auto"
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
