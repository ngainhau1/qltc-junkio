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

export function Transactions() {
    const { transactions } = useSelector(state => state.transactions)
    const [activeTab, setActiveTab] = useState('history') // 'history' | 'recurring'
    const [isAddRuleOpen, setIsAddRuleOpen] = useState(false)

    // Group transactions by Date
    const groupedTransactions = transactions.reduce((groups, transaction) => {
        const date = new Date(transaction.date || transaction.transaction_date).toLocaleDateString() // Support both date formats
        if (!groups[date]) {
            groups[date] = []
        }
        groups[date].push(transaction)
        return groups
    }, {})

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
                    <p className="text-muted-foreground">Manage expenses & recurring rules.</p>
                </div>
                {activeTab === 'recurring' && (
                    <Button onClick={() => setIsAddRuleOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Add Rule
                    </Button>
                )}
            </header>

            {/* Tabs Toggle */}
            <div className="flex p-1 bg-muted rounded-lg w-fit">
                <button
                    onClick={() => setActiveTab('history')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${activeTab === 'history' ? 'bg-white shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    <History className="h-4 w-4" /> History
                </button>
                <button
                    onClick={() => setActiveTab('recurring')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${activeTab === 'recurring' ? 'bg-white shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    <Repeat className="h-4 w-4" /> Recurring Rules
                </button>
            </div>

            {activeTab === 'history' ? (
                <>
                    <div className="flex gap-4">
                        <Input placeholder="Search transactions..." className="max-w-xs" />
                    </div>

                    <div className="space-y-6">
                        {Object.keys(groupedTransactions).length === 0 && (
                            <div className="text-center py-10 text-muted-foreground">No transactions found.</div>
                        )}
                        {Object.keys(groupedTransactions).map(date => (
                            <Card key={date}>
                                <CardHeader className="py-3 bg-muted/20">
                                    <CardTitle className="text-sm font-medium">{date}</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {groupedTransactions[date].map(t => (
                                        <div key={t.id} className="flex items-center justify-between p-4 border-b last:border-0 hover:bg-muted/50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className={`flex h-10 w-10 items-center justify-center rounded-full border ${t.type === 'INCOME' ? 'bg-green-100 border-green-200' : 'bg-red-100 border-red-200'}`}>
                                                    {t.type === 'INCOME'
                                                        ? <ArrowDownLeft className={`h-5 w-5 ${t.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`} />
                                                        : <ArrowUpRight className={`h-5 w-5 ${t.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`} />
                                                    }
                                                </div>
                                                <div>
                                                    <p className="font-medium">{t.description}</p>
                                                    <p className="text-xs text-muted-foreground capitalize">{t.category_id}</p>
                                                </div>
                                            </div>
                                            <div className={`font-semibold ${t.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                                                {t.type === 'INCOME' ? '+' : '-'}{formatCurrency(t.amount)}
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </>
            ) : (
                <RecurringRulesList />
            )}

            <Modal
                isOpen={isAddRuleOpen}
                onClose={() => setIsAddRuleOpen(false)}
                title="Add Recurring Rule"
            >
                <RecurringRuleForm onSuccess={() => setIsAddRuleOpen(false)} />
            </Modal>
        </div>
    )
}
