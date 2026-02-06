import { useState } from "react"
import { useSelector } from "react-redux"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { ArrowUpRight, ArrowDownLeft, Plus, History, Repeat } from "lucide-react"
import { RecurringRulesList } from "@/components/features/recurring/RecurringRulesList"
import { RecurringRuleForm } from "@/components/features/recurring/RecurringRuleForm"
import { Modal } from "@/components/ui/modal"
import { VirtualizedTransactionList } from "@/components/features/transactions/VirtualizedTransactionList"

export function Transactions() {
    const { transactions } = useSelector(state => state.transactions)
    const [activeTab, setActiveTab] = useState('history') // 'history' | 'recurring'
    const [isAddRuleOpen, setIsAddRuleOpen] = useState(false)

    const [searchTerm, setSearchTerm] = useState('')

    // Filter transactions based on search term
    const filteredTransactions = transactions.filter(t => {
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
                    <h1 className="text-3xl font-bold tracking-tight">Giao Dịch</h1>
                    <p className="text-muted-foreground">Quản lý chi tiêu & lập lịch định kỳ.</p>
                </div>
                {activeTab === 'recurring' && (
                    <Button onClick={() => setIsAddRuleOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Thêm Lịch
                    </Button>
                )}
            </header>

            {/* Tabs Toggle */}
            <div className="flex p-1 bg-muted rounded-lg w-fit">
                <button
                    onClick={() => setActiveTab('history')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${activeTab === 'history' ? 'bg-white shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    <History className="h-4 w-4" /> Lịch Sử
                </button>
                <button
                    onClick={() => setActiveTab('recurring')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${activeTab === 'recurring' ? 'bg-white shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    <Repeat className="h-4 w-4" /> Định Kỳ
                </button>
            </div>

            {activeTab === 'history' ? (
                <>
                    <div className="flex gap-4">
                        <Input
                            placeholder="Tìm kiếm giao dịch..."
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
                title="Thêm Lịch Định Kỳ"
            >
                <RecurringRuleForm onSuccess={() => setIsAddRuleOpen(false)} />
            </Modal>
        </div>
    )
}
