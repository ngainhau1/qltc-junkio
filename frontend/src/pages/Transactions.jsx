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
    ArrowUpDown,
    Download,
    FileSpreadsheet,
    FileText,
    Filter,
    History,
    MoreHorizontal,
    Plus,
    Repeat,
    Upload,
    X,
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
    const { wallets } = useSelector((state) => state.wallets);
    const { categories } = useSelector((state) => state.categories);
    const { isImportModalOpen } = useSelector((state) => state.ui);
    const [activeTab, setActiveTab] = useState('history');
    const [isAddRuleOpen, setIsAddRuleOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    const contextWallets = wallets.filter((w) =>
        activeFamilyId ? w.family_id === activeFamilyId : !w.family_id
    );

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
        filter.sortBy,
        filter.sortOrder,
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

    const hasActiveFilters = filter.type || filter.walletId || filter.categoryId || filter.startDate || filter.endDate || (filter.sortBy !== 'date') || (filter.sortOrder !== 'DESC');

    const clearAllFilters = () => {
        dispatch(setFilter({
            type: '',
            walletId: '',
            categoryId: '',
            startDate: '',
            endDate: '',
            search: '',
            sortBy: 'date',
            sortOrder: 'DESC',
        }));
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

    const filterBar = (
        <div className="space-y-3 rounded-xl border bg-card p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <select
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                    value={filter.type}
                    onChange={(e) => dispatch(setFilter({ type: e.target.value }))}
                >
                    <option value="">{t('transactions.filters.allTypes', 'Tất cả loại')}</option>
                    <option value="INCOME">{t('transactions.filters.income', 'Thu nhập')}</option>
                    <option value="EXPENSE">{t('transactions.filters.expense', 'Chi tiêu')}</option>
                    <option value="TRANSFER_OUT">{t('transactions.filters.transferOut', 'Chuyển đi')}</option>
                    <option value="TRANSFER_IN">{t('transactions.filters.transferIn', 'Nhận về')}</option>
                </select>

                <select
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                    value={filter.walletId}
                    onChange={(e) => dispatch(setFilter({ walletId: e.target.value }))}
                >
                    <option value="">{t('transactions.filters.allWallets', 'Tất cả ví')}</option>
                    {contextWallets.map((w) => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                </select>

                <select
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                    value={filter.categoryId}
                    onChange={(e) => dispatch(setFilter({ categoryId: e.target.value }))}
                >
                    <option value="">{t('transactions.filters.allCategories', 'Tất cả danh mục')}</option>
                    {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>

                <select
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                    value={`${filter.sortBy}_${filter.sortOrder}`}
                    onChange={(e) => {
                        const [sortBy, sortOrder] = e.target.value.split('_');
                        dispatch(setFilter({ sortBy, sortOrder }));
                    }}
                >
                    <option value="date_DESC">{t('transactions.filters.sortDateDesc', 'Mới nhất trước')}</option>
                    <option value="date_ASC">{t('transactions.filters.sortDateAsc', 'Cũ nhất trước')}</option>
                    <option value="amount_DESC">{t('transactions.filters.sortAmountDesc', 'Số tiền cao → thấp')}</option>
                    <option value="amount_ASC">{t('transactions.filters.sortAmountAsc', 'Số tiền thấp → cao')}</option>
                </select>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="flex items-center gap-2">
                    <label className="shrink-0 text-sm text-muted-foreground">{t('transactions.filters.from', 'Từ')}</label>
                    <Input
                        type="date"
                        className="h-10"
                        value={filter.startDate}
                        onChange={(e) => dispatch(setFilter({ startDate: e.target.value }))}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <label className="shrink-0 text-sm text-muted-foreground">{t('transactions.filters.to', 'Đến')}</label>
                    <Input
                        type="date"
                        className="h-10"
                        value={filter.endDate}
                        onChange={(e) => dispatch(setFilter({ endDate: e.target.value }))}
                    />
                </div>
                <div className="lg:col-span-2 flex justify-end">
                    {hasActiveFilters && (
                        <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-muted-foreground hover:text-foreground">
                            <X className="mr-1 h-4 w-4" /> {t('transactions.filters.clearAll', 'Xóa bộ lọc')}
                        </Button>
                    )}
                </div>
            </div>
        </div>
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
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <Input
                            placeholder={t('transactions.search')}
                            className="w-full sm:max-w-sm"
                            value={filter.search}
                            onChange={(event) => dispatch(setFilter({ search: event.target.value }))}
                        />
                        <Button
                            variant={showFilters ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setShowFilters(!showFilters)}
                            className="shrink-0"
                        >
                            <Filter className="mr-2 h-4 w-4" />
                            {t('transactions.filters.toggle', 'Bộ lọc')}
                            {hasActiveFilters && (
                                <span className="ml-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary-foreground text-xs font-bold text-primary">!</span>
                            )}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                const next = filter.sortOrder === 'DESC' ? 'ASC' : 'DESC';
                                dispatch(setFilter({ sortOrder: next }));
                            }}
                            className="shrink-0"
                            title={filter.sortOrder === 'DESC' ? t('transactions.filters.sortAsc', 'Đảo ngược') : t('transactions.filters.sortDesc', 'Đảo ngược')}
                        >
                            <ArrowUpDown className="mr-2 h-4 w-4" />
                            {filter.sortBy === 'date'
                                ? (filter.sortOrder === 'DESC' ? t('transactions.filters.sortDateDescShort', 'Mới nhất') : t('transactions.filters.sortDateAscShort', 'Cũ nhất'))
                                : (filter.sortOrder === 'DESC' ? t('transactions.filters.sortAmountDescShort', 'Cao → Thấp') : t('transactions.filters.sortAmountAscShort', 'Thấp → Cao'))
                            }
                        </Button>
                    </div>

                    {showFilters && filterBar}

                    <div className="space-y-6">
                        {loading ? (
                            <div className="flex min-h-[320px] items-center justify-center rounded-xl border bg-card">
                                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                            </div>
                        ) : (
                            <VirtualizedTransactionList
                                transactions={transactions}
                                onRowClick={handleRowClick}
                                groupByDate={filter.sortBy === 'date'}
                            />
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
                                    {t('common.page')} {pagination.currentPage} / {pagination.totalPages} ({t('common.total', 'Tổng')}: {pagination.totalItems})
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
