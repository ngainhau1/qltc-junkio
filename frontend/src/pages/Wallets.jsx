import { useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { Wallet, MoreVertical, Edit2, Trash2, ChevronDown } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Modal } from "@/components/ui/modal"
import { WalletForm } from "@/components/features/wallets/WalletForm"
import { EmptyState } from "@/components/ui/empty-state"
import { useTranslation } from "react-i18next"
import { removeWallet } from "@/features/wallets/walletSlice"
import { setActiveFamily } from "@/features/families/familySlice"
import { getFinanceScopeLabels } from "@/features/finance/context"
import { toast } from "sonner"
import { PageHeader } from "@/components/layout/PageHeader"

const walletTypeKeyMap = {
    cash: 'wallets.form.types.cash',
    bank: 'wallets.form.types.bank',
    'credit-card': 'wallets.form.types.credit-card',
    'e-wallet': 'wallets.form.types.e-wallet',
}

export function Wallets() {
    const { t } = useTranslation()
    const dispatch = useDispatch()
    const { wallets } = useSelector((state) => state.wallets)
    const { activeFamilyId, families } = useSelector((state) => state.families)

    const [isAddWalletOpen, setIsAddWalletOpen] = useState(false)
    const [editingWallet, setEditingWallet] = useState(null)

    const handleDelete = async (id) => {
        if (!window.confirm(t('wallets.deleteConfirm'))) {
            return
        }

        try {
            await dispatch(removeWallet(id)).unwrap()
            toast.success(t('wallets.deleteSuccess'))
        } catch (error) {
            toast.error(error || t('wallets.deleteFailed'))
        }
    }

    const contextWallets = wallets.filter((wallet) =>
        activeFamilyId ? wallet.family_id === activeFamilyId : !wallet.family_id
    )
    const currentScope = getFinanceScopeLabels(t, { activeFamilyId, families })
    const addWalletLabel = currentScope.scope === 'family' ? t('wallets.context.addFamily') : t('wallets.context.addPersonal')
    const addWalletTitle = currentScope.scope === 'family' ? t('wallets.context.addFamilyTitle') : t('wallets.context.addPersonalTitle')
    const pageTitle = currentScope.scope === 'family' ? t('wallets.context.familyTitle') : t('wallets.context.personalTitle')
    const pageDescription =
        currentScope.scope === 'family'
            ? t('wallets.context.familyDesc', { target: currentScope.scopeTargetLabel })
            : t('wallets.context.personalDesc')
    const emptyTitle = currentScope.scope === 'family' ? t('wallets.context.emptyFamilyTitle') : t('wallets.context.emptyPersonalTitle')
    const emptyDescription =
        currentScope.scope === 'family'
            ? t('wallets.context.emptyFamilyDesc', { target: currentScope.scopeTargetLabel })
            : t('wallets.context.emptyPersonalDesc')
    const editScope = editingWallet
        ? getFinanceScopeLabels(t, { activeFamilyId, families, familyId: editingWallet.family_id ?? null })
        : currentScope
    const editWalletTitle = editScope.scope === 'family' ? t('wallets.context.editFamilyTitle') : t('wallets.context.editPersonalTitle')

    return (
        <div className="space-y-6">
            <PageHeader
                title={pageTitle}
                description={pageDescription}
                actions={
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                className="w-full justify-between sm:w-auto"
                                data-testid="wallets-scope"
                            >
                                <span>{t('wallets.context.scopeButton')}: {currentScope.scopeTargetLabel}</span>
                                <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-64">
                            <DropdownMenuItem onClick={() => dispatch(setActiveFamily(null))}>
                                {t('common.personal')}
                            </DropdownMenuItem>
                            {families.map((family) => (
                                <DropdownMenuItem key={family.id} onClick={() => dispatch(setActiveFamily(family.id))}>
                                    {t('common.familyNamed', { name: family.name })}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                }
            />

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {contextWallets.length === 0 ? (
                    <div className="col-span-full">
                        <EmptyState
                            icon={Wallet}
                            title={emptyTitle}
                            description={emptyDescription}
                        />
                    </div>
                ) : (
                    contextWallets.map((wallet) => {
                        const walletTypeKey = walletTypeKeyMap[wallet.type]
                        const walletTypeLabel = walletTypeKey ? t(walletTypeKey) : wallet.type

                        return (
                            <Card key={wallet.id} className="relative overflow-hidden">
                                <div className="absolute right-0 top-0 p-4 opacity-10">
                                    <Wallet className="h-24 w-24" />
                                </div>
                                <CardHeader className="pb-2">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <CardTitle className="truncate text-lg">{wallet.name}</CardTitle>
                                            <CardDescription className="mt-1 capitalize">
                                                {wallet.family_id ? t('wallets.familyWallet') : t('wallets.personalWallet')}
                                                {wallet.type ? ` - ${walletTypeLabel}` : ''}
                                            </CardDescription>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className="relative z-10 inline-flex h-10 w-10 items-center justify-center rounded-md transition-colors hover:bg-muted">
                                                    <MoreVertical className="h-4 w-4 text-muted-foreground" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => setEditingWallet(wallet)}>
                                                    <Edit2 className="mr-2 h-4 w-4" />
                                                    <span>{t('common.edit')}</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(wallet.id)}>
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    <span>{t('common.delete')}</span>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{formatCurrency(wallet.balance)}</div>
                                    <p className="mt-2 text-xs text-muted-foreground">
                                        {t('common.id')}: {wallet.id.substring(0, 8)}...
                                    </p>
                                </CardContent>
                            </Card>
                        )
                    })
                )}

                <Card
                    className="flex min-h-[150px] cursor-pointer items-center justify-center border-dashed transition-colors hover:bg-muted/50"
                    onClick={() => setIsAddWalletOpen(true)}
                    data-testid="wallets-add-cta"
                >
                    <div className="text-center text-muted-foreground">
                        <p className="font-medium">{addWalletLabel}</p>
                    </div>
                </Card>
            </div>

            <Modal
                isOpen={isAddWalletOpen}
                onClose={() => setIsAddWalletOpen(false)}
                title={addWalletTitle}
            >
                <WalletForm onSuccess={() => setIsAddWalletOpen(false)} />
            </Modal>

            <Modal
                isOpen={Boolean(editingWallet)}
                onClose={() => setEditingWallet(null)}
                title={editWalletTitle}
            >
                {editingWallet && (
                    <WalletForm
                        initialData={editingWallet}
                        onSuccess={() => setEditingWallet(null)}
                    />
                )}
            </Modal>
        </div>
    )
}
