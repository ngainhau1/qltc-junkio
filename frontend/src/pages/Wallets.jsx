import { useState } from "react"
import { useSelector } from "react-redux"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { Wallet } from "lucide-react"
import { Modal } from "@/components/ui/modal"
import { WalletForm } from "@/components/features/wallets/WalletForm"

export function Wallets() {
    const { wallets } = useSelector(state => state.wallets)
    const [isAddWalletOpen, setIsAddWalletOpen] = useState(false)

    return (

        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold tracking-tight">Ví Của Tôi</h1>
                <p className="text-muted-foreground">Quản lý nguồn tiền của bạn.</p>
            </header>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {wallets.map(wallet => (
                    <Card key={wallet.id} className="relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Wallet className="w-24 h-24" />
                        </div>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg">{wallet.name}</CardTitle>
                            <CardDescription className="capitalize">{wallet.type}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(wallet.balance)}</div>
                            <p className="text-xs text-muted-foreground mt-2">
                                ID: {wallet.id.substring(0, 8)}...
                            </p>
                        </CardContent>
                    </Card>
                ))}

                {/* Add Wallet Card */}
                <Card
                    className="flex items-center justify-center border-dashed cursor-pointer hover:bg-muted/50 transition-colors min-h-[150px]"
                    onClick={() => setIsAddWalletOpen(true)}
                >
                    <div className="text-center text-muted-foreground">
                        <p className="font-medium">+ Thêm Ví Mới</p>
                    </div>
                </Card>
            </div>

            <Modal
                isOpen={isAddWalletOpen}
                onClose={() => setIsAddWalletOpen(false)}
                title="Thêm Ví Mới"
            >
                <WalletForm onSuccess={() => setIsAddWalletOpen(false)} />
            </Modal>
        </div>
    )
}
