import { Link, useLocation } from "react-router-dom"
import { Home, Wallet, PieChart, Settings, Users, ArrowRightLeft, ChevronsUpDown, Target, Plus, TrendingUp, Shield, PiggyBank } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useSelector, useDispatch } from "react-redux"
import { setActiveFamily } from "@/features/families/familySlice"
import { openAddTransactionModal } from "@/features/ui/uiSlice"
import { useTranslation } from "react-i18next"

export function Sidebar({ className }) {
    const { user } = useSelector(state => state.auth)
    const { t } = useTranslation();
    const location = useLocation()
    const dispatch = useDispatch()
    const { families, activeFamilyId } = useSelector(state => state.families)

    const sidebarItems = [
        { icon: Home, label: t('nav.dashboard'), href: "/" },
        { icon: ArrowRightLeft, label: t('nav.transactions'), href: "/transactions" },
        { icon: Wallet, label: t('nav.wallets'), href: "/wallets" },
        { icon: PiggyBank, label: t('nav.budgets'), href: "/budgets" },
        { icon: Target, label: t('nav.goals'), href: "/goals" },
        { icon: PieChart, label: t('nav.reports'), href: "/reports" },
        { icon: TrendingUp, label: t('nav.forecast'), href: "/forecast" },
        { icon: Users, label: t('nav.family'), href: "/family" },
        ...(user?.role === 'admin' ? [{ icon: Shield, label: t('nav.admin'), href: "/admin" }] : []),
    ]

    const activeFamily = families.find(f => f.id === activeFamilyId)
    const contextName = activeFamily ? activeFamily.name : t('sidebar.personalWallet')

    return (
        <div className={cn("pb-12 min-h-screen border-r bg-card hidden md:block w-64 fixed left-0 top-0", className)}>
            <div className="space-y-4 py-4">
                <div className="px-3 py-2">
                    <div className="px-2 mb-6 pt-4">
                        <h2 className="text-lg font-bold tracking-tight">Junkio Finance</h2>
                    </div>
                    <div className="mb-6 px-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="w-full justify-between h-12 border-dashed">
                                    <div className="flex flex-col items-start truncate text-left">
                                        <span className="text-xs text-muted-foreground uppercase font-semibold">{t('sidebar.context')}</span>
                                        <span className="font-bold truncate w-[140px]">{contextName}</span>
                                    </div>
                                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56">
                                <DropdownMenuItem onClick={() => dispatch(setActiveFamily(null))}>
                                    {t('sidebar.personalWallet')}
                                </DropdownMenuItem>
                                {families.map(family => (
                                    <DropdownMenuItem key={family.id} onClick={() => dispatch(setActiveFamily(family.id))}>
                                        {family.name}
                                    </DropdownMenuItem>
                                ))}
                                <DropdownMenuItem className="text-muted-foreground text-xs pt-2">
                                    <Link to="/family">+ {t('sidebar.manageFamily')}</Link>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <div className="space-y-1">
                        {sidebarItems.map((item, index) => (
                            <Button
                                key={index}
                                variant={location.pathname === item.href ? "secondary" : "ghost"}
                                className="w-full justify-start gap-2"
                                asChild
                            >
                                <Link to={item.href}>
                                    <item.icon className="h-4 w-4" />
                                    {item.label}
                                </Link>
                            </Button>
                        ))}
                    </div>
                </div>
                <div className="px-3 py-2">
                    <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                        {t('nav.settings')}
                    </h2>
                    <div className="space-y-1">
                        <div className="space-y-1">
                            <Button variant={location.pathname === "/settings" ? "secondary" : "ghost"} className="w-full justify-start gap-2" asChild>
                                <Link to="/settings">
                                    <Settings className="h-4 w-4" />
                                    {t('sidebar.general')}
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-5 mt-4">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 shadow-md" onClick={() => dispatch(openAddTransactionModal())}>
                    <Plus className="mr-2 h-4 w-4" /> {t('sidebar.addTransaction')}
                </Button>
            </div>
        </div>
    )
}
