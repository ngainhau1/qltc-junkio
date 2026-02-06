import { Link, useLocation } from "react-router-dom"
import { Home, Wallet, PieChart, Users, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { useDispatch } from "react-redux"
import { openAddTransactionModal } from "@/features/ui/uiSlice"

const navItems = [
    { icon: Home, label: "Tổng Quan", href: "/" },
    { icon: Wallet, label: "Ví", href: "/wallets" },
    { icon: PieChart, label: "Báo Cáo", href: "/reports" },
    { icon: Users, label: "Gia Đình", href: "/family" },
]

export function BottomNav({ className }) {
    const location = useLocation()
    const dispatch = useDispatch()

    return (
        <div className={cn("fixed bottom-0 left-0 right-0 border-t bg-background md:hidden z-50", className)}>
            <div className="flex justify-between items-center h-16 px-6">
                {/* First 2 Items */}
                {navItems.slice(0, 2).map((item, index) => {
                    const isActive = location.pathname === item.href
                    return (
                        <Link
                            key={index}
                            to={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center space-y-1 cursor-pointer transition-colors",
                                isActive ? "text-primary" : "text-muted-foreground hover:text-primary"
                            )}
                        >
                            <item.icon className={cn("h-5 w-5", isActive && "fill-current/20")} />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    )
                })}

                {/* Center FAB */}
                <div className="relative -top-5">
                    <button
                        onClick={() => dispatch(openAddTransactionModal())}
                        className="h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
                    >
                        <Plus className="h-6 w-6" />
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
                                "flex flex-col items-center justify-center space-y-1 cursor-pointer transition-colors",
                                isActive ? "text-primary" : "text-muted-foreground hover:text-primary"
                            )}
                        >
                            <item.icon className={cn("h-5 w-5", isActive && "fill-current/20")} />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}
