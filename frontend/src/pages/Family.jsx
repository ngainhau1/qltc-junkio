import { useState } from "react"
import { useSelector, useDispatch } from "react-redux"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { addFamily, setActiveFamily } from "@/features/families/familySlice"
import { Users, Plus, ArrowRight } from "lucide-react"
import { simplifyDebts } from "@/utils/debtSimplification"
import { formatCurrency } from "@/lib/utils"

export function Family() {
    const dispatch = useDispatch()
    const { families, activeFamilyId } = useSelector(state => state.families)
    const { user } = useSelector(state => state.auth)
    const [newFamilyName, setNewFamilyName] = useState("")

    const { wallets } = useSelector(state => state.wallets)
    const { transactions } = useSelector(state => state.transactions)

    // --- Redux Connected Logic ---
    const activeFamily = families.find(f => f.id === activeFamilyId)

    // 1. Get Family Wallets
    const familyWalletIds = wallets
        .filter(w => w.family_id === activeFamilyId)
        .map(w => w.id)

    // 2. Get Family Expenses
    // We only care about EXPENSES for debt splitting
    const familyExpenses = transactions.filter(t =>
        familyWalletIds.includes(t.wallet_id) && t.type === 'EXPENSE'
    )

    // 3. Transform for Algorithm
    const formattedExpenses = familyExpenses.map(t => {
        const payer = activeFamily?.members.find(m => m.id === t.user_id)
        const payerName = payer ? payer.name : 'Unknown User'

        return {
            id: t.id,
            paidBy: payerName,
            splitAmong: activeFamily?.members.map(m => m.name) || [], // Split equal among all
            amount: parseFloat(t.amount),
            desc: t.description
        }
    }).slice(0, 50) // Limit to 50 for performance demo if thousands exist

    const [settlements, setSettlements] = useState([])

    const handleCreateFamily = (e) => {
        e.preventDefault()
        if (!newFamilyName.trim()) return

        const newFamily = {
            id: 'fam-' + Date.now(),
            name: newFamilyName,
            members: [user], // Creator is first member
            created_at: new Date().toISOString()
        }
        dispatch(addFamily(newFamily))
        setNewFamilyName("")
    }

    const runSimplification = () => {
        if (formattedExpenses.length === 0) return
        const results = simplifyDebts(formattedExpenses)
        setSettlements(results)
    }

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Quản Lý Gia Đình</h1>
                    <p className="text-muted-foreground">Quản lý các nhóm chi tiêu chung của bạn.</p>
                </div>
            </header>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Create New Family */}
                <Card>
                    <CardHeader>
                        <CardTitle>Tạo Gia Đình Mới</CardTitle>
                        <CardDescription>Bắt đầu nhóm quản lý chi tiêu chung với gia đình.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreateFamily} className="flex gap-2">
                            <Input
                                placeholder="Tên Gia Đình (vd: Nhà Smith)"
                                value={newFamilyName}
                                onChange={(e) => setNewFamilyName(e.target.value)}
                            />
                            <Button type="submit">
                                <Plus className="h-4 w-4 mr-2" /> Tạo
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Family List */}
                <Card>
                    <CardHeader>
                        <CardTitle>Gia Đình Của Bạn</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {families.length === 0 ? (
                            <div className="text-center py-6 text-muted-foreground">
                                Chưa có gia đình nào. Hãy tạo mới để bắt đầu!
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {families.map(family => {
                                    const isOwner = family.owner_id === user?.id
                                    return (
                                        <div key={family.id} className="flex items-center justify-between border p-3 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                                                    <Users className="h-5 w-5 text-primary" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium">{family.name}</p>
                                                        {isOwner && (
                                                            <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded border border-yellow-200">
                                                                Chủ nhóm
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">
                                                        {family.members.length} thành viên • {isOwner ? 'Bạn quản lý' : 'Thành viên'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                {isOwner && (
                                                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                                                        Xóa
                                                    </Button>
                                                )}
                                                <Button
                                                    variant={activeFamilyId === family.id ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => dispatch(setActiveFamily(activeFamilyId === family.id ? null : family.id))}
                                                >
                                                    {activeFamilyId === family.id ? "Đang Chọn" : "Chuyển Đổi"}
                                                </Button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Debt Demo Section */}
            {activeFamilyId ? (
                <div className="grid gap-6 md:grid-cols-2">
                    <Card className="max-h-[500px] overflow-auto">
                        <CardHeader>
                            <CardTitle>Chi Tiêu Chung ({formattedExpenses.length})</CardTitle>
                            <CardDescription>Danh sách các giao dịch từ Quỹ Gia Đình.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {formattedExpenses.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">Chưa có giao dịch chung nào.</p>
                                ) : (
                                    formattedExpenses.map(t => (
                                        <div key={t.id} className="text-sm border-b pb-2">
                                            <p className="font-medium">{t.desc}</p>
                                            <p className="text-muted-foreground">
                                                {t.paidBy} đã trả {formatCurrency(t.amount)} (Chia đều cho {t.splitAmong.length} người)
                                            </p>
                                        </div>
                                    ))
                                )}
                                <Button onClick={runSimplification} className="w-full mt-4" disabled={formattedExpenses.length === 0}>
                                    Tối Ưu Hóa Nợ (Thuật Toán Splitwise)
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Thanh Toán Tối Ưu</CardTitle>
                            <CardDescription>Ai cần phải trả cho ai để cân bằng.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {settlements.length === 0 ? (
                                <div className="text-muted-foreground text-sm italic">
                                    {formattedExpenses.length > 0 ? "Nhấn nút để chạy thuật toán..." : "Cần có giao dịch để tính toán."}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {settlements.map((s, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-green-50 text-green-800 rounded-md">
                                            <div className="flex items-center gap-2 font-medium">
                                                <span>{s.from}</span>
                                                <ArrowRight className="h-4 w-4" />
                                                <span>{s.to}</span>
                                            </div>
                                            <div className="font-bold">{formatCurrency(s.amount)}</div>
                                        </div>
                                    ))}
                                    <p className="text-xs text-muted-foreground pt-4 text-center">
                                        Giao dịch được giảm thiểu bằng Thuật Toán Tham Lam (Greedy).
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <Card>
                    <CardContent className="py-10 text-center">
                        <p className="text-muted-foreground">Vui lòng chọn một Gia Đình ở trên để xem tính năng Quản Lý Nợ.</p>
                    </CardContent>
                </Card>
            )}


        </div>
    )
}
