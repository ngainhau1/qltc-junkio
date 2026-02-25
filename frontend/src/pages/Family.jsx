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
import { addFamily, setActiveFamily, updateMemberRole, removeMember } from "@/features/families/familySlice"
import { Users, Plus, ArrowRight, MoreHorizontal, Shield, ShieldAlert, LogOut, Check, Copy } from "lucide-react"
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

    // Create Family Modal State
    const [createModalOpen, setCreateModalOpen] = useState(false)
    const [newFamilyDesc, setNewFamilyDesc] = useState("")

    // Invite Modal State
    const [inviteModalOpen, setInviteModalOpen] = useState(false)
    const [inviteCode, setInviteCode] = useState("")
    const [copied, setCopied] = useState(false)
    const [associatedFamilyName, setAssociatedFamilyName] = useState("")

    const handleCreateFamily = (e) => {
        e.preventDefault()
        if (!newFamilyName.trim()) return

        const newFamily = {
            id: 'fam-' + Date.now(),
            name: newFamilyName,
            description: newFamilyDesc,
            owner_id: user?.id,
            members: [{ ...user, role: 'OWNER', joinedAt: new Date().toISOString() }],
            created_at: new Date().toISOString()
        }
        dispatch(addFamily(newFamily))
        setNewFamilyName("")
        setNewFamilyDesc("")
        setCreateModalOpen(false)
    }

    const runSimplification = () => {
        if (formattedExpenses.length === 0) return
        const results = simplifyDebts(formattedExpenses)
        setSettlements(results)
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

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Quản Lý Gia Đình</h1>
                    <p className="text-muted-foreground">Quản lý các nhóm chi tiêu chung của bạn.</p>
                </div>
                <Button onClick={() => setCreateModalOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Tạo Gia Đình Mới
                </Button>
            </header>

            <div className="grid gap-6 md:grid-cols-1">
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
                                    // Find current user's role in this family
                                    const myRole = family.members.find(m => m.id === user?.id)?.role || 'MEMBER'

                                    return (
                                        <div key={family.id} className="border p-4 rounded-lg space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                                                        <Users className="h-5 w-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-medium text-lg">{family.name}</p>
                                                            {myRole === 'OWNER' && (
                                                                <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded border border-yellow-200">
                                                                    Owner
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-muted-foreground">
                                                            {family.members.length} thành viên • Vai trò: {myRole}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant={activeFamilyId === family.id ? "default" : "outline"}
                                                        size="sm"
                                                        onClick={() => dispatch(setActiveFamily(activeFamilyId === family.id ? null : family.id))}
                                                    >
                                                        {activeFamilyId === family.id ? "Đang Chọn" : "Chuyển Đổi"}
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Member List (Expandable or visible) */}
                                            {activeFamilyId === family.id && (
                                                <div className="mt-4 border-t pt-4">
                                                    <h4 className="text-sm font-semibold mb-3">Thành Viên</h4>
                                                    <div className="space-y-3">
                                                        {family.members.map(member => (
                                                            <div key={member.id} className="flex items-center justify-between bg-muted/30 p-2 rounded-md">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold">
                                                                        {member.name.charAt(0)}
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-sm font-medium">{member.name} {member.id === user?.id && '(Bạn)'}</p>
                                                                        <p className="text-[10px] text-muted-foreground uppercase">{member.role || 'MEMBER'}</p>
                                                                    </div>
                                                                </div>

                                                                {/* Actions for Owner/Admin */}
                                                                {(myRole === 'OWNER' || myRole === 'ADMIN') && member.id !== user?.id && (
                                                                    <DropdownMenu>
                                                                        <DropdownMenuTrigger asChild>
                                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                                                                <span className="sr-only">Open menu</span>
                                                                                <MoreHorizontal className="h-4 w-4" />
                                                                            </Button>
                                                                        </DropdownMenuTrigger>
                                                                        <DropdownMenuContent align="end">
                                                                            <DropdownMenuLabel>Quản lý thành viên</DropdownMenuLabel>
                                                                            <DropdownMenuSeparator />
                                                                            <DropdownMenuItem onClick={() => dispatch(updateMemberRole({ familyId: family.id, memberId: member.id, newRole: 'ADMIN' }))}>
                                                                                <Shield className="mr-2 h-4 w-4" /> Thăng làm Admin
                                                                            </DropdownMenuItem>
                                                                            <DropdownMenuItem onClick={() => dispatch(updateMemberRole({ familyId: family.id, memberId: member.id, newRole: 'MEMBER' }))}>
                                                                                <Users className="mr-2 h-4 w-4" /> Đặt làm Thành viên
                                                                            </DropdownMenuItem>
                                                                            <DropdownMenuItem onClick={() => dispatch(updateMemberRole({ familyId: family.id, memberId: member.id, newRole: 'VIEWER' }))}>
                                                                                <ShieldAlert className="mr-2 h-4 w-4" /> Đặt làm Viewer
                                                                            </DropdownMenuItem>
                                                                            <DropdownMenuSeparator />
                                                                            <DropdownMenuItem className="text-red-600" onClick={() => dispatch(removeMember({ familyId: family.id, memberId: member.id }))}>
                                                                                <LogOut className="mr-2 h-4 w-4" /> Mời ra khỏi nhóm
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
                                                            <Plus className="h-3 w-3 mr-2" /> Mời Thành Viên Mới
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

            <Modal isOpen={inviteModalOpen} onClose={() => setInviteModalOpen(false)} title={`Mời tham gia ${associatedFamilyName}`}>
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">Chia sẻ mã này cho người thân để họ tham gia nhóm gia đình.</p>
                    <div className="flex items-center gap-2">
                        <Input value={inviteCode} readOnly className="font-mono text-center text-lg tracking-widest uppercase bg-muted" />
                        <Button size="icon" onClick={copyToClipboard}>
                            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">Mã có hiệu lực trong 24 giờ.</p>
                </div>
            </Modal>

            <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Tạo Gia Đình Mới">
                <form onSubmit={handleCreateFamily} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Tên Gia Đình / Nhóm</label>
                        <Input
                            placeholder="Ví dụ: Nhà Hạnh Phúc, Team Đi Phượt..."
                            value={newFamilyName}
                            onChange={(e) => setNewFamilyName(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Mô tả (Tùy chọn)</label>
                        <Input
                            placeholder="Mô tả ngắn về nhóm này..."
                            value={newFamilyDesc}
                            onChange={(e) => setNewFamilyDesc(e.target.value)}
                        />
                    </div>
                    <div className="pt-2 flex justify-end gap-2">
                        <Button type="button" variant="ghost" onClick={() => setCreateModalOpen(false)}>Hủy</Button>
                        <Button type="submit">Tạo Nhóm</Button>
                    </div>
                </form>
            </Modal>

        </div>
    )
}
