import { useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { Wallet, MoreVertical, Edit2, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Modal } from "@/components/ui/modal"
import { WalletForm } from "@/components/features/wallets/WalletForm"
import { EmptyState } from "@/components/ui/empty-state"
import { useTranslation } from "react-i18next"
import { removeWallet } from "@/features/wallets/walletSlice"
import { toast } from "sonner"

export function Wallets() {
    const { t } = useTranslation()
    const dispatch = useDispatch()
    const { wallets } = useSelector(state => state.wallets)
    const { activeFamilyId } = useSelector(state => state.families)
    
    const [isAddWalletOpen, setIsAddWalletOpen] = useState(false)
    const [editingWallet, setEditingWallet] = useState(null)

    const handleDelete = async (id) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa ví này?")) {
            try {
                await dispatch(removeWallet(id)).unwrap()
                toast.success("Đã xóa ví thành công")
            } catch (error) {
                toast.error(error || "Không thể xóa ví")
            }
        }
    }

    // Filter wallets based on context
    const contextWallets = wallets.filter(w =>
        activeFamilyId ? w.family_id === activeFamilyId : !w.family_id
    )

    return (

        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold tracking-tight">{t('wallets.title')}</h1>
                <p className="text-muted-foreground">{t('wallets.desc')}</p>
            </header>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {contextWallets.length === 0 ? (
                    <div className="col-span-full">
                        <EmptyState
                            icon={Wallet}
                            title={t('wallets.emptyTitle')}
                            description={t('wallets.emptyDesc')}
                        />
                    </div>
                ) : (
                    contextWallets.map(wallet => (
                        <Card key={wallet.id} className="relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Wallet className="w-24 h-24" />
                            </div>
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-lg">{wallet.name}</CardTitle>
                                        <CardDescription className="capitalize mt-1">
                                            {activeFamilyId ? t('wallets.familyWallet') : t('wallets.personalWallet')}
                                            {wallet.type ? ` - ${t(`wallets.form.types.${wallet.type}`, { defaultValue: wallet.type })}` : ''}
                                        </CardDescription>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-muted relative z-10 transition-colors">
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
                                <p className="text-xs text-muted-foreground mt-2">
                                    ID: {wallet.id.substring(0, 8)}...
                                </p>
                            </CardContent>
                        </Card>
                    ))
                )}

                {/* Add Wallet Card */}
                <Card
                    className="flex items-center justify-center border-dashed cursor-pointer hover:bg-muted/50 transition-colors min-h-[150px]"
                    onClick={() => setIsAddWalletOpen(true)}
                >
                    <div className="text-center text-muted-foreground">
                        <p className="font-medium">{t('wallets.addWallet')}</p>
                    </div>
                </Card>
            </div>

            <Modal
                isOpen={isAddWalletOpen}
                onClose={() => setIsAddWalletOpen(false)}
                title={t('wallets.addWalletTitle')}
            >
                <WalletForm onSuccess={() => setIsAddWalletOpen(false)} />
            </Modal>

            {/* Edit Wallet Modal */}
            <Modal
                isOpen={!!editingWallet}
                onClose={() => setEditingWallet(null)}
                title={"Sửa thông tin ví"}
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
