import { Link, useLocation } from "react-router-dom"
import { Home, Wallet, PieChart, Users, Plus, Target } from "lucide-react"
import { cn } from "@/lib/utils"
import { useDispatch } from "react-redux"
import { openAddTransactionModal } from "@/features/ui/uiSlice"
import { useTranslation } from "react-i18next"

export function BottomNav({ className }) {
    const { t } = useTranslation()
    const location = useLocation()
    const dispatch = useDispatch()

    const navItems = [
        { icon: Home, label: t('nav.dashboard'), href: "/" },
        { icon: Wallet, label: t('nav.wallets'), href: "/wallets" },
        { icon: Target, label: t('nav.goals'), href: "/goals" },
        { icon: Users, label: t('nav.family'), href: "/family" },
    ]

    return (
        <div className={cn("fixed bottom-0 left-0 right-0 border-t bg-background md:hidden z-50 pb-[env(safe-area-inset-bottom)]", className)}>
            <div className="flex justify-between items-center h-16 px-4">
                {/* First 2 Items */}
                {navItems.slice(0, 2).map((item, index) => {
                    const isActive = location.pathname === item.href
                    return (
                        <Link
                            key={index}
                            to={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center space-y-1 w-16 h-14 cursor-pointer transition-colors rounded-xl mx-0.5",
                                isActive ? "text-primary" : "text-muted-foreground hover:text-primary hover:bg-muted/50"
                            )}
                        >
                            <item.icon className={cn("h-6 w-6", isActive && "fill-current/20")} />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    )
                })}

                {/* Center FAB */}
                <div className="relative -top-5 mx-2">
                    <button
                        onClick={() => dispatch(openAddTransactionModal())}
                        className="h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center hover:bg-primary/90 hover:-translate-y-1 transition-all active:scale-95"
                    >
                        <Plus className="h-7 w-7" />
                    </button>
                </div>

                {/* Last 2 Items */}
                {navItems.slice(2).map((item, index) => {
                    const isActive = location.pathname === item.href
                    return (
                        <Link
                            key={index}
                            to={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center space-y-1 w-16 h-14 cursor-pointer transition-colors rounded-xl mx-0.5",
                                isActive ? "text-primary" : "text-muted-foreground hover:text-primary hover:bg-muted/50"
                            )}
                        >
                            <item.icon className={cn("h-6 w-6", isActive && "fill-current/20")} />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}
