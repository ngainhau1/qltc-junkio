import { Link, useLocation } from "react-router-dom"
import { Home, Wallet, Users, Plus, Menu } from "lucide-react"
import { cn } from "@/lib/utils"
import { useDispatch } from "react-redux"
import { openAddTransactionModal } from "@/features/ui/uiSlice"
import { useTranslation } from "react-i18next"

export function BottomNav({ className }) {
    const { t } = useTranslation()
    const location = useLocation()
    const dispatch = useDispatch()

    const leftItems = [
        { icon: Home, label: t('nav.dashboard'), href: "/" },
        { icon: Wallet, label: t('nav.wallets'), href: "/wallets" },
    ]

    const rightItems = [
        { icon: Users, label: t('nav.family'), href: "/family" },
        { icon: Menu, label: t('nav.menu', { defaultValue: 'Menu' }), href: "/menu" },
    ]

    const renderNavItem = (item, index) => {
        const isActive = item.href === "/" 
            ? location.pathname === "/" 
            : location.pathname.startsWith(item.href)
        return (
            <Link
                key={index}
                to={item.href}
                className={cn(
                    "flex flex-col items-center justify-center gap-0.5 min-w-[56px] h-full cursor-pointer transition-all rounded-xl",
                    isActive
                        ? "text-primary"
                        : "text-muted-foreground active:text-primary"
                )}
            >
                <item.icon
                    className={cn(
                        "h-6 w-6 transition-transform",
                        isActive && "scale-110"
                    )}
                    strokeWidth={isActive ? 2.5 : 2}
                />
                <span className={cn(
                    "text-[10px] leading-tight",
                    isActive ? "font-bold" : "font-medium"
                )}>
                    {item.label}
                </span>
            </Link>
        )
    }

    return (
        <div
            className={cn(
                "fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur-lg md:hidden z-50 pb-[env(safe-area-inset-bottom)]",
                className
            )}
        >
            <div className="flex justify-around items-center h-16 px-2 max-w-md mx-auto">
                {/* Left 2 items */}
                {leftItems.map(renderNavItem)}

                {/* Center FAB */}
                <div className="relative -top-4">
                    <button
                        onClick={() => dispatch(openAddTransactionModal())}
                        className="h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center hover:bg-primary/90 active:scale-90 transition-all"
                        aria-label={t('sidebar.addTransaction', { defaultValue: 'Thêm giao dịch' })}
                    >
                        <Plus className="h-7 w-7" />
                    </button>
                </div>

                {/* Right 2 items */}
                {rightItems.map(renderNavItem)}
            </div>
        </div>
    )
}
