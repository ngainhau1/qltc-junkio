import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useSelector } from "react-redux"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Users, ArrowRightLeft, Home as HomeIcon, Search, Lock, Unlock, Shield, ChevronLeft, ChevronRight } from "lucide-react"
import api from "@/lib/api"

export function AdminDashboard() {
    const { t } = useTranslation()
    const { user } = useSelector(state => state.auth)
    const [stats, setStats] = useState(null)
    const [users, setUsers] = useState([])
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState("")
    const [loading, setLoading] = useState(true) // eslint-disable-line no-unused-vars

    useEffect(() => {
        fetchDashboard()
        fetchUsers()
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        fetchUsers()
    }, [page, search]) // eslint-disable-line react-hooks/exhaustive-deps

    const fetchDashboard = async () => {
        try {
            const { data } = await api.get("/admin/dashboard")
            setStats(data)
        } catch (err) {
            console.error("Admin dashboard error:", err)
        }
    }

    const fetchUsers = async () => {
        try {
            setLoading(true)
            const { data } = await api.get(`/admin/users?page=${page}&limit=10&search=${search}`)
            setUsers(data.users)
            setTotal(data.total)
        } catch (err) {
            console.error("Admin users error:", err)
        } finally {
            setLoading(false)
        }
    }

    const toggleLock = async (userId) => {
        try {
            await api.put(`/admin/users/${userId}/toggle-lock`)
            fetchUsers()
        } catch (err) {
            console.error("Toggle lock error:", err)
        }
    }

    if (user?.role !== "admin") {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Card className="p-8 text-center max-w-md">
                    <Shield className="h-12 w-12 mx-auto text-red-500 mb-4" />
                    <h2 className="text-xl font-bold mb-2">{t("admin.accessDenied")}</h2>
                    <p className="text-muted-foreground">{t("admin.accessDeniedDesc")}</p>
                </Card>
            </div>
        )
    }

    return (
        <div className="p-4 md:p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">{t("admin.title")}</h1>
                <p className="text-muted-foreground">{t("admin.desc")}</p>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="p-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/10">
                                <Users className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">{t("admin.totalUsers")}</p>
                                <p className="text-2xl font-bold">{stats.totalUsers}</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-green-500/10">
                                <ArrowRightLeft className="h-5 w-5 text-green-500" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">{t("admin.totalTransactions")}</p>
                                <p className="text-2xl font-bold">{stats.totalTransactions}</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-purple-500/10">
                                <HomeIcon className="h-5 w-5 text-purple-500" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">{t("admin.totalFamilies")}</p>
                                <p className="text-2xl font-bold">{stats.totalFamilies}</p>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* User Management */}
            <Card className="p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                    <h2 className="text-lg font-semibold">{t("admin.userManagement")}</h2>
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={t("admin.search")}
                            className="pl-9"
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left py-3 px-2 font-medium">{t("admin.colName")}</th>
                                <th className="text-left py-3 px-2 font-medium">Email</th>
                                <th className="text-left py-3 px-2 font-medium">{t("admin.colRole")}</th>
                                <th className="text-left py-3 px-2 font-medium">{t("admin.colStatus")}</th>
                                <th className="text-right py-3 px-2 font-medium">{t("admin.colActions")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id} className="border-b hover:bg-muted/50 transition-colors">
                                    <td className="py-3 px-2 font-medium">{u.name}</td>
                                    <td className="py-3 px-2 text-muted-foreground">{u.email}</td>
                                    <td className="py-3 px-2">
                                        <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                                            {u.role}
                                        </Badge>
                                    </td>
                                    <td className="py-3 px-2">
                                        <Badge variant={u.is_locked ? "destructive" : "outline"}>
                                            {u.is_locked ? t("admin.locked") : t("admin.active")}
                                        </Badge>
                                    </td>
                                    <td className="py-3 px-2 text-right">
                                        {u.id !== user?.id && (
                                            <Button
                                                size="sm"
                                                variant={u.is_locked ? "outline" : "destructive"}
                                                onClick={() => toggleLock(u.id)}
                                            >
                                                {u.is_locked ? <Unlock className="h-3 w-3 mr-1" /> : <Lock className="h-3 w-3 mr-1" />}
                                                {u.is_locked ? t("admin.unlockAccount") : t("admin.lockAccount")}
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                    <span>{t("admin.showing", { from: (page - 1) * 10 + 1, to: Math.min(page * 10, total), total })}</span>
                    <div className="flex gap-2">
                        <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" disabled={page * 10 >= total} onClick={() => setPage(p => p + 1)}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    )
}
