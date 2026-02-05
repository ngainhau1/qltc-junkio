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

    // --- Mock Debt State (Local for demo) ---
    const [mockExpenses, setMockExpenses] = useState([
        { id: 1, paidBy: 'Alice', splitAmong: ['Alice', 'Bob', 'Charlie'], amount: 300000, desc: 'Dinner' },
        { id: 2, paidBy: 'Bob', splitAmong: ['Alice', 'Bob'], amount: 100000, desc: 'Taxi' },
        { id: 3, paidBy: 'Charlie', splitAmong: ['Bob', 'Charlie'], amount: 500000, desc: 'Groceries' },
    ])

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
        const results = simplifyDebts(mockExpenses)
        setSettlements(results)
    }

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Family Management</h1>
                    <p className="text-muted-foreground">Manage your shared financial groups.</p>
                </div>
            </header>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Create New Family */}
                <Card>
                    <CardHeader>
                        <CardTitle>Create New Family</CardTitle>
                        <CardDescription>Start a shared group to manage expenses together.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreateFamily} className="flex gap-2">
                            <Input
                                placeholder="Family Name (e.g. Smith Household)"
                                value={newFamilyName}
                                onChange={(e) => setNewFamilyName(e.target.value)}
                            />
                            <Button type="submit">
                                <Plus className="h-4 w-4 mr-2" /> Create
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Family List */}
                <Card>
                    <CardHeader>
                        <CardTitle>Your Families</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {families.length === 0 ? (
                            <div className="text-center py-6 text-muted-foreground">
                                No families yet. Create one to get started!
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {families.map(family => (
                                    <div key={family.id} className="flex items-center justify-between border p-3 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                                                <Users className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-medium">{family.name}</p>
                                                <p className="text-xs text-muted-foreground">{family.members.length} members</p>
                                            </div>
                                        </div>
                                        <Button
                                            variant={activeFamilyId === family.id ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => dispatch(setActiveFamily(activeFamilyId === family.id ? null : family.id))}
                                        >
                                            {activeFamilyId === family.id ? "Active" : "Switch To"}
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Debt Demo Section */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Debt Demo: Shared Expenses</CardTitle>
                        <CardDescription>Mock data to test simplification.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {mockExpenses.map(t => (
                                <div key={t.id} className="text-sm border-b pb-2">
                                    <p className="font-medium">{t.desc}</p>
                                    <p className="text-muted-foreground">{t.paidBy} paid {formatCurrency(t.amount)} for {t.splitAmong.join(', ')}</p>
                                </div>
                            ))}
                            <Button onClick={runSimplification} className="w-full mt-4">
                                Optimize Debts (Splitwise Logic)
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Optimized Settlements</CardTitle>
                        <CardDescription>Who needs to pay whom.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {settlements.length === 0 ? (
                            <div className="text-muted-foreground text-sm italic">Run algorithm to see results...</div>
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
                                    Transactions minimized using Greedy Algorithm.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>


        </div>
    )
}
