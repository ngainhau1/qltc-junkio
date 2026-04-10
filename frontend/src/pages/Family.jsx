import { useState } from "react"
import { useSelector, useDispatch } from "react-redux"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Modal } from "@/components/ui/modal"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { createFamily, fetchFamilies, setActiveFamily, removeMemberFromFamily } from "@/features/families/familySlice"
import { approveDebt, rejectDebt, settleDebts, fetchTransactions } from "@/features/transactions/transactionSlice"
import { Users, Plus, ArrowRight, MoreHorizontal, Shield, ShieldAlert, LogOut, Check, Copy, Receipt, Target, CheckCircle2, XCircle } from "lucide-react"
import { simplifyDebts } from "@/utils/debtSimplification"
import { toast } from "sonner"
import { EmptyState } from "@/components/ui/empty-state"
import { useTranslation } from "react-i18next"
import { SharedExpenseModal } from "@/components/features/families/SharedExpenseModal"
import { formatCurrency } from "@/lib/utils"
import { PageHeader } from "@/components/layout/PageHeader"

export function Family() {
    const { t } = useTranslation();
    const dispatch = useDispatch()
    const { families, activeFamilyId } = useSelector(state => state.families)
    const { user } = useSelector(state => state.auth)
    const [newFamilyName, setNewFamilyName] = useState("")

    const { wallets } = useSelector(state => state.wallets)
    const { transactions } = useSelector(state => state.transactions)

    // --- Redux Connected Logic ---
    const activeFamily = families.find(f => f.id === activeFamilyId)
    const activeFamilyMembers = Array.isArray(activeFamily?.members) ? activeFamily.members : []

    // 1. Get Family Wallets
    const familyWalletIds = wallets
        .filter(w => w.family_id === activeFamilyId)
        .map(w => w.id)

    // 2. Get Family Expenses for debts
    // Include both EXPENSE and our magical SETTLEMENT transfers for the math to balance out perfectly
    const familyDebtTransactions = transactions.filter(t =>
        familyWalletIds.includes(t.wallet_id) &&
        (t.type === 'EXPENSE' || (t.type === 'TRANSFER' && t.category_id === 'cat-settlement'))
    )

    // 3. Transform for Algorithm (NO SLICING here to ensure exact mathematical net zero)
    const allFamilyDebts = familyDebtTransactions.map(t => {
        let splitAmongIds = [];
        if (t.shares && t.shares.length > 0) {
            splitAmongIds = t.shares.map(s => s.user_id);
        } else {
            splitAmongIds = activeFamilyMembers.map((member) => member.id);
        }

        return {
            id: t.id,
            type: t.type,
            paidBy: t.user_id, // Pass ID to algo
            splitAmong: splitAmongIds,
            shares: t.shares,
            amount: parseFloat(t.amount),
            desc: t.description
        }
    })

    // UI purely for displaying the expense list (Limit to 50 items and hide settlements)
    const displayExpenses = allFamilyDebts.filter(t => t.type !== 'TRANSFER').slice(0, 50)

    const pendingDebts = allFamilyDebts.flatMap(tx => {
        if (!tx.shares) return [];
        const myPendingShare = tx.shares.find(s => s.user_id === user?.id && s.approval_status === 'PENDING');
        if (myPendingShare) {
            return [{
                transactionId: tx.id,
                shareId: myPendingShare.id,
                amount: myPendingShare.amount,
                desc: tx.desc,
                paidBy: tx.paidBy
            }];
        }
        return [];
    });

    const getMemberName = (id) => {
        const member = activeFamilyMembers.find((item) => item.id === id)
        return member ? member.name : t('common.unknown')
    }

    const [settlements, setSettlements] = useState([])

    // Create Family Modal State
    const [createModalOpen, setCreateModalOpen] = useState(false)
    const [newFamilyDesc, setNewFamilyDesc] = useState("")

    // Invite Modal State
    const [inviteModalOpen, setInviteModalOpen] = useState(false)
    const [inviteCode, setInviteCode] = useState("")
    const [copied, setCopied] = useState(false)
    const [associatedFamilyName, setAssociatedFamilyName] = useState("")

    // Settle Modal State
    const [settleModalOpen, setSettleModalOpen] = useState(false)
    const [selectedSettlement, setSelectedSettlement] = useState(null)

    // Shared Expense Modal State
    const [sharedExpenseModalOpen, setSharedExpenseModalOpen] = useState(false)

    const handleCreateFamily = async (e) => {
        e.preventDefault()
        if (!newFamilyName.trim()) return

        try {
            await dispatch(createFamily({ name: newFamilyName, description: newFamilyDesc })).unwrap();
            await dispatch(fetchFamilies()).unwrap();
            setNewFamilyName("");
            setNewFamilyDesc("");
            setCreateModalOpen(false);
            toast.success(t('family.modals.create.success'));
        } catch (error) {
            console.error('Create family error:', error);
            toast.error(error);
        }
    }

    const runSimplification = () => {
        if (allFamilyDebts.length === 0) {
            toast.info(t('family.toasts.optimizationEmpty'));
            return;
        }
        const results = simplifyDebts(allFamilyDebts)
        if (results.length === 0) {
            toast.success(t('family.toasts.optimizationZero'));
        }
        setSettlements(results)
    }

    const handleShareAction = async (transactionId, shareId, newStatus) => {
        try {
            if (newStatus === 'APPROVED') {
                await dispatch(approveDebt(transactionId)).unwrap();
            } else {
                await dispatch(rejectDebt(transactionId)).unwrap();
            }
            toast.success(newStatus === 'APPROVED' ? t('family.toasts.debtApproved') : t('family.toasts.debtRejected'));
            // Recalculate settlements automatically so UI feels alive
            setTimeout(() => runSimplification(), 300);
        } catch (error) {
            console.error('Debt approval error:', error);
            toast.error(error);
        }
    }

    const handleOpenInvite = (family) => {
        setAssociatedFamilyName(family.name)
        // Generate a random 6-character code
        const code = Math.random().toString(36).substring(2, 8).toUpperCase()
        setInviteCode(code)
        setInviteModalOpen(true)
        setCopied(false)
    }

    const copyToClipboard = () => {
        navigator.clipboard.writeText(inviteCode)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleSettleClick = (settlement) => {
        setSelectedSettlement(settlement)
        setSettleModalOpen(true)
    }

    const confirmSettle = async () => {
        if (!selectedSettlement || familyWalletIds.length === 0) return;

        const { from, to, amount } = selectedSettlement;

        try {
            await dispatch(settleDebts({
                from_user_id: from,
                to_user_id: to,
                amount: amount,
                from_wallet_id: familyWalletIds[0],
                to_wallet_id: familyWalletIds[0]
            })).unwrap();

            toast.success(t('family.toasts.paymentRecorded', { amount: formatCurrency(amount) }));
            
            // Reload transactions so the debts recalculate over the wire
            dispatch(fetchTransactions());
            setSettleModalOpen(false);
        } catch (error) {
            console.error('Settlement error:', error);
            toast.error(error);
        }
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title={t('family.title')}
                description={t('family.desc')}
                actions={
                    <Button onClick={() => setCreateModalOpen(true)} className="w-full sm:w-auto">
                        <Plus className="mr-2 h-4 w-4" /> {t('family.createBtn')}
                    </Button>
                }
            />

            <div className="grid gap-6 md:grid-cols-1">
                {/* Family List */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t('family.list.title')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {families.length === 0 ? (
                            <div className="text-center py-6 text-muted-foreground">
                                {t('family.list.empty')}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {families.map(family => {
                                    // Find current user's role in this family
                                    const members = Array.isArray(family.members) ? family.members : []
                                    const myRole = family.owner_id === user?.id
                                        ? 'OWNER'
                                        : family.my_role || members.find((member) => member.id === user?.id)?.role || 'MEMBER'

                                    return (
                                        <div
                                            key={family.id}
                                            data-testid="family-card"
                                            className="border p-4 rounded-lg space-y-4"
                                        >
                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                                <div className="flex min-w-0 items-center gap-3">
                                                    <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                                                        <Users className="h-5 w-5 text-primary" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <p className="truncate font-medium text-lg">{family.name}</p>
                                                            {myRole === 'OWNER' && (
                                                                <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded border border-yellow-200">
                                                                    {t('family.list.ownerBadge')}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-muted-foreground">
                                                            {t('family.list.members', { count: members.length })} • {t('family.list.role', { role: myRole })}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex w-full gap-2 sm:w-auto">
                                                    <Button
                                                        data-testid="family-switch-button"
                                                        variant={activeFamilyId === family.id ? "default" : "outline"}
                                                        size="sm"
                                                        className="w-full sm:w-auto"
                                                        onClick={() => dispatch(setActiveFamily(activeFamilyId === family.id ? null : family.id))}
                                                    >
                                                        {activeFamilyId === family.id ? t('family.list.active') : t('family.list.switch')}
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Member List (Expandable or visible) */}
                                            {activeFamilyId === family.id && (
                                                <div className="mt-4 border-t pt-4">
                                                    <h4 className="text-sm font-semibold mb-3">{t('family.list.memberListTitle')}</h4>
                                                    <div className="space-y-3">
                                                        {members.map(member => (
                                                            <div key={member.id} className="flex flex-col gap-3 rounded-md bg-muted/30 p-2 sm:flex-row sm:items-center sm:justify-between">
                                                                <div className="flex min-w-0 items-center gap-3">
                                                                    <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold">
                                                                        {member.name.charAt(0)}
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="truncate text-sm font-medium">{member.name} {member.id === user?.id && t('family.list.you')}</p>
                                                                        <p className="text-[10px] text-muted-foreground uppercase">{member.role || 'MEMBER'}</p>
                                                                    </div>
                                                                </div>

                                                                {/* Actions for Owner/Admin */}
                                                                {(myRole === 'OWNER' || myRole === 'ADMIN') && member.id !== user?.id && (
                                                                    <DropdownMenu>
                                                                        <DropdownMenuTrigger asChild>
                                                                            <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground">
                                                                                <span className="sr-only">{t('family.actions.openMenu')}</span>
                                                                                <MoreHorizontal className="h-4 w-4" />
                                                                            </Button>
                                                                        </DropdownMenuTrigger>
                                                                        <DropdownMenuContent align="end">
                                                                            <DropdownMenuLabel>{t('family.actions.manage')}</DropdownMenuLabel>
                                                                            <DropdownMenuSeparator />
                                                                            {/* Temporarily disabled role updates until backend API is ready */}
                                                                            <DropdownMenuSeparator />
                                                                            <DropdownMenuItem className="text-red-600" onClick={() => dispatch(removeMemberFromFamily({ familyId: family.id, userId: member.id }))}>
                                                                                <LogOut className="mr-2 h-4 w-4" /> {t('family.actions.remove')}
                                                                            </DropdownMenuItem>
                                                                        </DropdownMenuContent>
                                                                    </DropdownMenu>
                                                                )}
                                                            </div>
                                                        ))}

                                                        {/* Invite Button */}
                                                        <Button
                                                            variant="outline" size="sm" className="w-full mt-2 border-dashed"
                                                            onClick={() => handleOpenInvite(family)}
                                                        >
                                                            <Plus className="h-3 w-3 mr-2" /> {t('family.actions.invite')}
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Pending Debts Section */}
            {activeFamilyId && pendingDebts.length > 0 && (
                <Card className="border-orange-200 bg-orange-50/50 dark:border-orange-900/50 dark:bg-orange-900/10">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-orange-800 dark:text-orange-400 flex items-center gap-2">
                            <ShieldAlert className="h-5 w-5" />
                            {t('family.pendingDebts.title', { count: pendingDebts.length })}
                        </CardTitle>
                        <CardDescription>
                            {t('family.pendingDebts.desc')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {pendingDebts.map((debt, idx) => (
                            <div key={idx} className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3 bg-white dark:bg-background rounded-lg border shadow-sm">
                                <div>
                                    <p className="font-medium text-sm">{debt.desc}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        <span className="font-semibold text-foreground">{getMemberName(debt.paidBy)}</span> {t('family.pendingDebts.paidByText')} <span className="font-semibold text-orange-600 dark:text-orange-400">{formatCurrency(debt.amount)}</span>
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full sm:w-auto border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-900/20"
                                        onClick={() => handleShareAction(debt.transactionId, debt.shareId, 'REJECTED')}
                                    >
                                        <XCircle className="h-4 w-4 mr-1.5" /> {t('family.pendingDebts.btnReject')}
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
                                        onClick={() => handleShareAction(debt.transactionId, debt.shareId, 'APPROVED')}
                                    >
                                        <CheckCircle2 className="h-4 w-4 mr-1.5" /> {t('family.pendingDebts.btnApprove')}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Debt Demo Section */}
            {activeFamilyId ? (
                <div className="grid gap-6 xl:grid-cols-2">
                    <Card className="flex max-h-[500px] flex-col overflow-auto">
                        <CardHeader className="mb-2 flex flex-col gap-3 border-b pb-2 sm:flex-row sm:items-start sm:justify-between">
                            <div className="space-y-1">
                                <CardTitle>{t('family.expenses.title', { count: displayExpenses.length })}</CardTitle>
                                <CardDescription>{t('family.expenses.desc')}</CardDescription>
                            </div>
                            <Button size="sm" onClick={() => setSharedExpenseModalOpen(true)} className="w-full shrink-0 sm:ml-4 sm:w-auto">
                                <Plus className="mr-2 h-4 w-4" /> {t('sharedExpense.addBtn')}
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {displayExpenses.length === 0 ? (
                                    <div className="py-8">
                                        <EmptyState
                                            icon={Receipt}
                                            title={t('family.expenses.emptyTitle')}
                                            description={t('family.expenses.emptyDesc')}
                                        />
                                    </div>
                                ) : (
                                    displayExpenses.map(tx => (
                                        <div key={tx.id} className="text-sm border-b pb-2">
                                            <p className="font-medium">{tx.desc}</p>
                                            <p className="text-muted-foreground">
                                                {t('family.expenses.paidBy', { name: getMemberName(tx.paidBy), amount: formatCurrency(tx.amount) })}
                                                {tx.shares && tx.shares.length > 0 && tx.shares[0].status === 'PAID'
                                                    ? ` ${t('family.expenses.settleUp')}`
                                                    : (tx.shares && tx.shares.length > 0
                                                        ? ` ${t('family.expenses.splitMembers', { count: tx.shares.length })}`
                                                        : ` ${t('family.expenses.splitEven', { count: tx.splitAmong.length })}`
                                                    )
                                                }
                                            </p>
                                        </div>
                                    ))
                                )}
                                <Button onClick={runSimplification} className="w-full mt-4" disabled={allFamilyDebts.length === 0}>
                                    {t('family.expenses.optimizeBtn')}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t('family.settlement.title')}</CardTitle>
                            <CardDescription>{t('family.settlement.desc')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {settlements.length === 0 ? (
                                <div className="py-8">
                                    <EmptyState
                                        icon={Target}
                                        title={t('family.settlement.emptyTitle')}
                                        description={allFamilyDebts.length > 0 ? t('family.settlement.emptyDescHasTx') : t('family.settlement.emptyDescZero')}
                                    />
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {settlements.map((s, idx) => (
                                        <div key={idx} className="flex flex-col gap-3 rounded-lg border border-green-200 bg-green-50 p-3 text-green-800 dark:border-green-800/50 dark:bg-green-900/20 dark:text-green-400 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="flex items-center gap-2 font-medium md:gap-4">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">{t('family.settlement.debtor')}</span>
                                                    <span className="text-sm font-semibold text-foreground truncate max-w-[80px] md:max-w-full">{getMemberName(s.from)}</span>
                                                </div>
                                                <ArrowRight className="h-4 w-4 text-green-600 dark:text-green-500 shrink-0" />
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">{t('family.settlement.creditor')}</span>
                                                    <span className="text-sm font-semibold text-foreground truncate max-w-[80px] md:max-w-full">{getMemberName(s.to)}</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-1 sm:items-end">
                                                <div className="font-bold">{formatCurrency(s.amount)}</div>
                                                <Button size="sm" onClick={() => handleSettleClick(s)} className="h-6 text-[10px] px-2 bg-green-600 hover:bg-green-700 text-white shadow-sm">
                                                    {t('family.settlement.payBtn')}
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    <p className="text-xs text-muted-foreground pt-4 text-center">
                                        {t('family.settlement.algorithmNote')}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <Card>
                    <CardContent className="py-10 text-center">
                        <p className="text-muted-foreground">{t('family.emptySelection')}</p>
                    </CardContent>
                </Card>
            )}

            {/* Modals */}
            <Modal isOpen={inviteModalOpen} onClose={() => setInviteModalOpen(false)} title={t('family.modals.invite.title', { name: associatedFamilyName })}>
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">{t('family.modals.invite.desc')}</p>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <Input value={inviteCode} readOnly className="font-mono text-center text-lg tracking-widest uppercase bg-muted" />
                        <Button size="icon" onClick={copyToClipboard} className="w-full sm:w-10">
                            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">{t('family.modals.invite.validity')}</p>
                </div>
            </Modal>

            <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title={t('family.modals.create.title')}>
                <form onSubmit={handleCreateFamily} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">{t('family.modals.create.nameLabel')}</label>
                        <Input
                            placeholder={t('family.modals.create.namePlaceholder')}
                            value={newFamilyName}
                            onChange={(e) => setNewFamilyName(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">{t('family.modals.create.descLabel')}</label>
                        <Input
                            placeholder={t('family.modals.create.descPlaceholder')}
                            value={newFamilyDesc}
                            onChange={(e) => setNewFamilyDesc(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-col-reverse gap-2 border-t pt-2 sm:flex-row sm:justify-end">
                        <Button type="button" variant="ghost" onClick={() => setCreateModalOpen(false)} className="w-full sm:w-auto">{t('family.modals.create.cancel')}</Button>
                        <Button type="submit" className="w-full sm:w-auto">{t('family.modals.create.submit')}</Button>
                    </div>
                </form>
            </Modal>

            {/* Settle Modal */}
            <Modal isOpen={settleModalOpen} onClose={() => setSettleModalOpen(false)} title={t('family.modals.settle.title')}>
                {selectedSettlement && (
                    <div className="space-y-6">
                        <div className="flex flex-col gap-4 rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-800/50 dark:bg-green-900/20 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex flex-col items-center">
                                <div className="h-12 w-12 rounded-full bg-background border flex items-center justify-center font-bold mb-2 shadow-sm text-foreground">
                                    {getMemberName(selectedSettlement.from).charAt(0)}
                                </div>
                                <span className="font-semibold text-sm">{getMemberName(selectedSettlement.from)}</span>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{t('family.modals.settle.payTo')}</span>
                                <ArrowRight className="h-5 w-5 text-green-600 dark:text-green-500 my-1" />
                                <span className="font-bold text-lg text-green-600 dark:text-green-500">{formatCurrency(selectedSettlement.amount)}</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="h-12 w-12 rounded-full bg-background border flex items-center justify-center font-bold mb-2 shadow-sm text-foreground">
                                    {getMemberName(selectedSettlement.to).charAt(0)}
                                </div>
                                <span className="font-semibold text-sm">{getMemberName(selectedSettlement.to)}</span>
                            </div>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 p-4 rounded-xl">
                            <p className="text-sm text-blue-800 dark:text-blue-300">
                                {t('family.modals.settle.note')}
                            </p>
                        </div>
                        <div className="flex flex-col-reverse gap-3 border-t pt-2 sm:flex-row sm:justify-end">
                            <Button type="button" variant="ghost" onClick={() => setSettleModalOpen(false)} className="w-full sm:w-auto">{t('family.modals.settle.cancel')}</Button>
                            <Button onClick={confirmSettle} className="w-full bg-green-600 text-white hover:bg-green-700 sm:w-auto">{t('family.modals.settle.submit')}</Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Shared Expense Modal */}
            <SharedExpenseModal
                isOpen={sharedExpenseModalOpen}
                onClose={() => setSharedExpenseModalOpen(false)}
                family={activeFamily}
                familyWalletId={familyWalletIds.length > 0 ? familyWalletIds[0] : null}
            />

        </div>
    )
}
