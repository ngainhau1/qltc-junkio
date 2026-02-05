import { useSelector } from "react-redux"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { Wallet } from "lucide-react"

export function Wallets() {
    const { wallets } = useSelector(state => state.wallets)

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold tracking-tight">Wallets</h1>
                <p className="text-muted-foreground">Manage your funding sources.</p>
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

                {/* Add Wallet Card Placeholder */}
                <Card className="flex items-center justify-center border-dashed cursor-pointer hover:bg-muted/50 transition-colors min-h-[150px]">
                    <div className="text-center text-muted-foreground">
                        <p className="font-medium">+ Add New Wallet</p>
                    </div>
                </Card>
            </div>
        </div>
    )
}
