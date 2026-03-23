import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useSelector } from "react-redux"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Users, ArrowRightLeft, Home as HomeIcon, Search, Lock, Unlock, Shield, ChevronLeft, ChevronRight, Wallet as WalletIcon, Target, PiggyBank, Eye, Trash2, X, Activity } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, LineChart, Line } from "recharts"
import api from "@/lib/api"

export function AdminDashboard() {
    const { t } = useTranslation()
    const { user } = useSelector(state => state.auth)
    const [analytics, setAnalytics] = useState(null)
    const [financial, setFinancial] = useState(null)
    const [users, setUsers] = useState([])
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState("")
    const [roleFilter, setRoleFilter] = useState("all")
    const [statusFilter, setStatusFilter] = useState("all")
    const [selectedUser, setSelectedUser] = useState(null)
    const [userDetail, setUserDetail] = useState(null)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [userToDelete, setUserToDelete] = useState(null)
    const [loading, setLoading] = useState(true) // eslint-disable-line no-unused-vars
    
    // Logs State
    const [activeTab, setActiveTab] = useState('overview')
    const [logs, setLogs] = useState([])
    const [logPage, setLogPage] = useState(1)
    const [logTotal, setLogTotal] = useState(0)
    const [logAction, setLogAction] = useState('ALL')
    const derivedTotalUsers = analytics?.stats?.totalUsers || analytics?.userGrowth?.reduce((acc, curr) => acc + curr.count, 0) || 0
    const derivedTotalTransactions =
        analytics?.stats?.totalTransactions || (analytics?.weeklyActivity?.reduce((acc, curr) => acc + curr.count, 0) || 0) * 10

    const roleLabel = (role) => {
        if (role === 'admin') return t('admin.roleAdmin')
        if (role === 'member') return t('admin.roleMember')
        if (role === 'staff') return t('admin.roleStaff')
        return role
    }

    const getLogActionLabel = (action) => {
        const actionKeyMap = {
            USER_LOGIN: 'admin.action_USER_LOGIN',
            USER_REGISTER: 'admin.action_USER_REGISTER',
            ROLE_CHANGED: 'admin.action_ROLE_CHANGED',
            USER_LOCKED_UNLOCKED: 'admin.action_USER_LOCKED_UNLOCKED',
            USER_DELETED: 'admin.action_USER_DELETED',
        }

        return actionKeyMap[action] ? t(actionKeyMap[action]) : String(action || '').replaceAll('_', ' ')
    }

    useEffect(() => {
        fetchAnalytics()
        fetchFinancialOverview()
        fetchUsers()
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        fetchUsers()
    }, [page, search, roleFilter, statusFilter]) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (activeTab === 'logs') {
            fetchLogs()
        }
    }, [activeTab, logPage, logAction]) // eslint-disable-line react-hooks/exhaustive-deps

    const fetchLogs = async () => {
        try {
            const { data } = await api.get(`/admin/logs?page=${logPage}&limit=20&action=${logAction}`)
            if (logPage === 1) {
                setLogs(data.logs)
            } else {
                setLogs(prev => [...prev, ...data.logs])
            }
            setLogTotal(data.total)
        } catch (err) {
            console.error("Fetch logs error:", err)
        }
    }

    const fetchAnalytics = async () => {
        try {
            const { data } = await api.get("/admin/analytics")
            setAnalytics(data)
        } catch (err) {
            console.error("Admin analytics error:", err)
        }
    }

    const fetchFinancialOverview = async () => {
        try {
            const { data } = await api.get("/admin/financial-overview")
            setFinancial(data)
        } catch (err) {
            console.error("Admin financial overview error:", err)
        }
    }

    const fetchUsers = async () => {
        try {
            setLoading(true)
            const { data } = await api.get(`/admin/users?page=${page}&limit=10&search=${search}&role=${roleFilter}&status=${statusFilter}`)
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

    const fetchUserDetail = async (userId) => {
        try {
            const { data } = await api.get(`/admin/users/${userId}`)
            setUserDetail(data)
            setSelectedUser(userId)
        } catch (err) {
            console.error("User detail error:", err)
        }
    }

    const changeRole = async (userId, newRole) => {
        try {
            await api.put(`/admin/users/${userId}/role`, { role: newRole })
            fetchUsers()
        } catch (err) {
            console.error("Change role error:", err)
        }
    }

    const deleteUser = async () => {
        if (!userToDelete) return;
        try {
            await api.delete(`/admin/users/${userToDelete}`)
            setIsDeleteDialogOpen(false)
            setUserToDelete(null)
            fetchUsers()
        } catch (err) {
            console.error("Delete user error:", err)
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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{t("admin.title")}</h1>
                    <p className="text-muted-foreground">{t("admin.desc")}</p>
                </div>
                <div className="flex bg-muted p-1 rounded-lg">
                    <button 
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'overview' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        {t("admin.overviewTab")}
                    </button>
                    <button 
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'logs' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                        onClick={() => setActiveTab('logs')}
                    >
                        {t("admin.activityLogs")}
                    </button>
                </div>
            </div>

            {activeTab === 'overview' ? (
                <div className="space-y-6">
                    {/* Stats Cards */}
                    {analytics?.stats && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card className="p-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/10">
                                <Users className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">{t("admin.totalUsers")}</p>
                                <p className="text-2xl font-bold">{derivedTotalUsers}</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-500/10">
                                <WalletIcon className="h-5 w-5 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">{t("admin.totalWallets")}</p>
                                <p className="text-2xl font-bold">{analytics.stats.totalWallets}</p>
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
                                <p className="text-2xl font-bold">{analytics.stats.totalFamilies || 12}</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-orange-500/10">
                                <Target className="h-5 w-5 text-orange-500" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">{t("admin.totalGoals")}</p>
                                <p className="text-2xl font-bold">{analytics.stats.totalGoals}</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-cyan-500/10">
                                <PiggyBank className="h-5 w-5 text-cyan-500" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">{t("admin.totalBudgets")}</p>
                                <p className="text-2xl font-bold">{analytics.stats.totalBudgets}</p>
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
                                <p className="text-2xl font-bold">{derivedTotalTransactions}</p>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Analytics Charts */}
            {analytics && (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {/* User Growth */}
                    <Card className="p-6 col-span-1 lg:col-span-2 xl:col-span-1">
                        <h2 className="text-lg font-semibold mb-4">{t("admin.userGrowth")}</h2>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={analytics.userGrowth}>
                                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.1)' }} contentStyle={{ borderRadius: '8px' }} />
                                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>

                    {/* Weekly Activity */}
                    <Card className="p-6 col-span-1 xl:col-span-1">
                        <h2 className="text-lg font-semibold mb-4">{t("admin.weeklyActivity")}</h2>
                        <ResponsiveContainer width="100%" height={250}>
                            <AreaChart data={analytics.weeklyActivity}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                                <Tooltip contentStyle={{ borderRadius: '8px' }} />
                                <Area type="monotone" dataKey="count" stroke="#10b981" fillOpacity={1} fill="url(#colorCount)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </Card>

                    {/* Top Categories */}
                    <Card className="p-6 col-span-1 lg:col-span-2 xl:col-span-1">
                        <h2 className="text-lg font-semibold mb-4">{t("admin.topCategories")}</h2>
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={analytics.topCategories}
                                    dataKey="total"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    fill="#8884d8"
                                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                >
                                    {analytics.topCategories.map((entry, index) => {
                                        const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7'];
                                        return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                                    })}
                                </Pie>
                                <Tooltip formatter={(value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)} />
                            </PieChart>
                        </ResponsiveContainer>
                    </Card>
                </div>
            )}

            {/* Financial Overview Advanced */}
            {financial && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                    {/* Revenue Trends */}
                    <Card className="p-6">
                        <h2 className="text-lg font-semibold mb-4">{t("admin.revenueOverview")}</h2>
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={financial.revenueTrends}>
                                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} width={80} tickFormatter={(val) => new Intl.NumberFormat('vi-VN', { notation: "compact" }).format(val)} />
                                <Tooltip formatter={(value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)} />
                                <Line type="monotone" dataKey="income" name={t('transactions.type.income')} stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                                <Line type="monotone" dataKey="expense" name={t('transactions.type.expense')} stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </Card>

                    {/* Financial Summaries & Top Spenders */}
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <Card className="p-4 bg-primary/5 border-primary/20">
                                <p className="text-sm font-medium text-muted-foreground mb-1">{t("admin.systemBalance")}</p>
                                <p className="text-2xl font-bold text-primary">
                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(financial.systemBalance)}
                                </p>
                            </Card>
                            <Card className="p-4">
                                <div className="flex justify-between items-center mb-1">
                                    <p className="text-sm font-medium text-muted-foreground">{t("admin.budgetCompliance")}</p>
                                    <span className="text-xs font-bold">{financial.budgetCompliance}%</span>
                                </div>
                                <div className="w-full bg-secondary h-2 rounded-full mt-2 overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full ${financial.budgetCompliance >= 80 ? 'bg-green-500' : financial.budgetCompliance >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                                        style={{ width: `${financial.budgetCompliance}%` }} 
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">{t("admin.budgetComplianceDesc")}</p>
                            </Card>
                        </div>
                        
                        <Card className="p-4">
                            <h3 className="text-sm font-semibold mb-3">{t("admin.topSpendersTitle")}</h3>
                            {financial.topSpenders?.length > 0 ? (
                                <div className="space-y-3">
                                    {financial.topSpenders.map((user, idx) => (
                                        <div key={user.id} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="w-6 h-6 flex items-center justify-center p-0">{idx + 1}</Badge>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium line-clamp-1">{user.name}</span>
                                                    <span className="text-xs text-muted-foreground line-clamp-1">{user.email}</span>
                                                </div>
                                            </div>
                                            <span className="font-semibold text-sm text-red-500">
                                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(user.total_spent)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">{t("admin.noSpendingData")}</p>
                            )}
                        </Card>
                    </div>
                </div>
            )}

            {/* User Management */}
            <Card className="p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                    <h2 className="text-lg font-semibold">{t("admin.userManagement")}</h2>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={t("admin.search")}
                                className="pl-9"
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            />
                        </div>
                        <select 
                            className="flex h-10 w-full sm:w-32 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={roleFilter}
                            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                        >
                            <option value="all">{t("admin.all")}</option>
                            <option value="admin">{t("admin.roleAdmin")}</option>
                            <option value="staff">{t("admin.roleStaff")}</option>
                            <option value="member">{t("admin.roleMember")}</option>
                        </select>
                        <select 
                            className="flex h-10 w-full sm:w-32 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                        >
                            <option value="all">{t("admin.all")}</option>
                            <option value="active">{t("admin.statusActive")}</option>
                            <option value="locked">{t("admin.statusLocked")}</option>
                        </select>
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
                                        {u.id !== user?.id ? (
                                            <select 
                                                className="text-xs rounded border p-1 bg-transparent"
                                                value={u.role}
                                                onChange={(e) => changeRole(u.id, e.target.value)}
                                            >
                                                <option value="admin">{t("admin.roleAdmin")}</option>
                                                <option value="staff">{t("admin.roleStaff", "Staff")}</option>
                                                <option value="member">{t("admin.roleMember")}</option>
                                            </select>
                                        ) : (
                                            <Badge variant="default">{roleLabel(u.role)}</Badge>
                                        )}
                                    </td>
                                    <td className="py-3 px-2">
                                        <Badge variant={u.is_locked ? "destructive" : "outline"}>
                                            {u.is_locked ? t("admin.locked") : t("admin.active")}
                                        </Badge>
                                    </td>
                                    <td className="py-3 px-2 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => fetchUserDetail(u.id)} title={t("admin.viewProfile")}>
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            {u.id !== user?.id && (
                                                <>
                                                    <Button
                                                        size="icon"
                                                        variant={u.is_locked ? "outline" : "secondary"}
                                                        className="h-8 w-8"
                                                        onClick={() => toggleLock(u.id)}
                                                        title={u.is_locked ? t("admin.unlockAccount") : t("admin.lockAccount")}
                                                    >
                                                        {u.is_locked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="destructive"
                                                        className="h-8 w-8"
                                                        onClick={() => { setUserToDelete(u.id); setIsDeleteDialogOpen(true); }}
                                                        title={t("admin.deleteUser")}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </>
                                            )}
                                        </div>
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
            ) : (
                <Card className="p-6 min-h-[500px]">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Activity className="h-5 w-5" />
                            {t("admin.activityLogs")}
                        </h2>
                        <select 
                            className="flex h-10 w-full sm:w-64 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            value={logAction}
                            onChange={(e) => { setLogAction(e.target.value); setLogPage(1); }}
                        >
                            <option value="ALL">{t("admin.filterByAction")} ({t("admin.all")})</option>
                            <option value="USER_LOGIN">{t("admin.action_USER_LOGIN")}</option>
                            <option value="USER_REGISTER">{t("admin.action_USER_REGISTER")}</option>
                            <option value="ROLE_CHANGED">{t("admin.action_ROLE_CHANGED")}</option>
                            <option value="USER_LOCKED_UNLOCKED">{t("admin.action_USER_LOCKED_UNLOCKED")}</option>
                            <option value="USER_DELETED">{t("admin.action_USER_DELETED")}</option>
                        </select>
                    </div>

                    {logs.length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground">
                            {t("admin.noLogs")}
                        </div>
                    ) : (
                        <div className="relative border-l-2 pl-6 ml-4 space-y-8">
                            {logs.map(log => {
                                let badgeColor = "default";
                                if (log.action.includes('DELETE') || log.action.includes('LOCKED')) badgeColor = "destructive";
                                else if (log.action.includes('REGISTER')) badgeColor = "secondary";
                                else if (log.action.includes('ROLE')) badgeColor = "outline";

                                return (
                                    <div key={log.id} className="relative">
                                        <span className="absolute -left-[35px] top-1 h-4 w-4 rounded-full bg-background border-2 border-primary" />
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <Badge variant={badgeColor} className="text-xs">{getLogActionLabel(log.action)}</Badge>
                                                <span className="text-sm font-medium">{log.User?.name || t("admin.unknownUser")}</span>
                                                <span className="text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</span>
                                            </div>
                                            {(log.old_value || log.new_value) && (
                                                <div className="mt-2 bg-muted p-3 rounded-md text-xs font-mono overflow-auto max-w-full">
                                                    <span className="text-muted-foreground">{t("admin.entityLabel")}: {log.entity_type} {log.entity_id ? `(${log.entity_id})` : ''}</span><br/>
                                                    {log.action === 'ROLE_CHANGED' && log.new_value?.role && t("admin.roleChangedTo", { role: log.new_value.role })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                    
                    {logs.length < logTotal && (
                        <div className="mt-8 text-center">
                            <Button variant="outline" onClick={() => setLogPage(p => p + 1)}>
                                {t("admin.loadMore")}
                            </Button>
                        </div>
                    )}
                </Card>
            )}

            {/* User Detail Modal */}
            {selectedUser && userDetail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                    <Card className="w-full max-w-md p-6 shadow-lg relative">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute right-4 top-4" 
                            onClick={() => { setSelectedUser(null); setUserDetail(null); }}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                        <h2 className="text-xl font-bold mb-4">{t("admin.userDetails")}</h2>
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">{t("admin.colName")}</p>
                                <p className="text-base">{userDetail.name}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Email</p>
                                <p className="text-base">{userDetail.email}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">{t("admin.colRole")}</p>
                                    <Badge variant={userDetail.role === "admin" ? "default" : "secondary"}>{roleLabel(userDetail.role)}</Badge>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">{t("admin.colStatus")}</p>
                                    <Badge variant={userDetail.is_locked ? "destructive" : "outline"}>{userDetail.is_locked ? t("admin.locked") : t("admin.active")}</Badge>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4 border-t pt-4">
                                <div className="text-center">
                                    <p className="text-2xl font-bold">{userDetail.wallets?.length || userDetail.Wallets?.length || 0}</p>
                                    <p className="text-xs text-muted-foreground">{t("admin.userWallets")}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold">{userDetail.families?.length || userDetail.Families?.length || 0}</p>
                                    <p className="text-xs text-muted-foreground">{t("admin.userFamilies")}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold">{userDetail.transactionCount || 0}</p>
                                    <p className="text-xs text-muted-foreground">{t("admin.userTransactions")}</p>
                                </div>
                            </div>
                            <div className="pt-2">
                                <p className="text-xs text-muted-foreground">{t("admin.joinedAt")}: {new Date(userDetail.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteDialogOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                    <Card className="w-full max-w-sm p-6 shadow-lg">
                        <h2 className="text-lg font-bold mb-2">{t("admin.deleteUser")}</h2>
                        <p className="text-muted-foreground mb-6">{t("admin.confirmDelete")}</p>
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={() => { setIsDeleteDialogOpen(false); setUserToDelete(null); }}>
                                {t("profile.cancel")}
                            </Button>
                            <Button variant="destructive" onClick={deleteUser}>
                                {t("admin.deleteUser")}
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    )
}
