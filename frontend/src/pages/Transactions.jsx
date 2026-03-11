import { useState } from "react"
import { useSelector, useDispatch } from "react-redux"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ArrowUpRight, ArrowDownLeft, Plus, History, Repeat } from "lucide-react"
import { RecurringRulesList } from "@/components/features/recurring/RecurringRulesList"
import { RecurringRuleForm } from "@/components/features/recurring/RecurringRuleForm"
import { Modal } from "@/components/ui/modal"
import { VirtualizedTransactionList } from "@/components/features/transactions/VirtualizedTransactionList"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Download, FileText, FileSpreadsheet, Upload } from "lucide-react"
import { exportToCSV, exportToPDF, exportToExcel } from "@/services/exportService"
import { useTranslation } from "react-i18next"
import { openImportModal, closeImportModal } from "@/features/ui/uiSlice"
import { ImportTransactionsModal } from "@/components/features/transactions/ImportTransactionsModal"

export function Transactions() {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const { transactions } = useSelector(state => state.transactions)
    const { wallets } = useSelector(state => state.wallets)
    const { activeFamilyId } = useSelector(state => state.families)
    const { isImportModalOpen } = useSelector(state => state.ui)
    const [activeTab, setActiveTab] = useState('history') // 'history' | 'recurring'
    const [isAddRuleOpen, setIsAddRuleOpen] = useState(false)

    const [searchTerm, setSearchTerm] = useState('')

    // Filter wallets and transactions based on context
    const contextWallets = wallets.filter(w =>
        activeFamilyId ? w.family_id === activeFamilyId : !w.family_id
    )
    const contextWalletIds = contextWallets.map(w => w.id)
    const contextTransactions = transactions.filter(t =>
        contextWalletIds.includes(t.wallet_id)
    )

    // Filter transactions based on search term
    const filteredTransactions = contextTransactions.filter(t => {
        if (!t) return false;
        const desc = t.description || '';
        const cat = t.category_id || '';
        return desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cat.toLowerCase().includes(searchTerm.toLowerCase());
    })



    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('transactions.title')}</h1>
                    <p className="text-muted-foreground">{t('transactions.desc')}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => dispatch(openImportModal())}>
                        <Upload className="mr-2 h-4 w-4" /> Import CSV
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                                <Download className="mr-2 h-4 w-4" /> {t('transactions.exportData')}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => exportToPDF(filteredTransactions)}>
                                <FileText className="mr-2 h-4 w-4" /> {t('transactions.exportPDF')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => exportToCSV(filteredTransactions)}>
                                <FileSpreadsheet className="mr-2 h-4 w-4" /> {t('transactions.exportCSV')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => exportToExcel(filteredTransactions)}>
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

            {/* Tabs Toggle */}
            <div className="flex p-1 bg-muted rounded-lg w-fit">
                <button
                    onClick={() => setActiveTab('history')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${activeTab === 'history' ? 'bg-background shadow-sm text-foreground border border-border' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    <History className="h-4 w-4" /> {t('transactions.tabs.history')}
                </button>
                <button
                    onClick={() => setActiveTab('recurring')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${activeTab === 'recurring' ? 'bg-background shadow-sm text-foreground border border-border' : 'text-muted-foreground hover:text-foreground'}`}
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
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="space-y-6">
                        <VirtualizedTransactionList transactions={filteredTransactions} />
                    </div>
                </>
            ) : (
                <RecurringRulesList />
            )}

            <Modal
                isOpen={isAddRuleOpen}
                onClose={() => setIsAddRuleOpen(false)}
                title={t('transactions.addRecurringTitle')}
            >
                <RecurringRuleForm onSuccess={() => setIsAddRuleOpen(false)} />
            </Modal>

            {/* Import Modal */}
            <ImportTransactionsModal
                isOpen={isImportModalOpen}
                onClose={() => dispatch(closeImportModal())}
            />
        </div>
    )
}
