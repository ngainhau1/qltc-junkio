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
        { icon: Menu, label: t('nav.menu'), href: "/menu" },
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
                    "flex h-full min-w-[56px] cursor-pointer flex-col items-center justify-center gap-0.5 rounded-xl transition-all",
                    isActive ? "text-primary" : "text-muted-foreground active:text-primary"
                )}
            >
                <item.icon
                    className={cn("h-6 w-6 transition-transform", isActive && "scale-110")}
                    strokeWidth={isActive ? 2.5 : 2}
                />
                <span className={cn("text-[10px] leading-tight", isActive ? "font-bold" : "font-medium")}>
                    {item.label}
                </span>
            </Link>
        )
    }

    return (
        <div
            className={cn(
                "fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg md:hidden",
                className
            )}
        >
            <div className="mx-auto flex h-16 max-w-md items-center justify-around px-2">
                {leftItems.map(renderNavItem)}

                <div className="relative -top-4">
                    <button
                        onClick={() => dispatch(openAddTransactionModal())}
                        className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:bg-primary/90 active:scale-90"
                        aria-label={t('sidebar.addTransaction')}
                    >
                        <Plus className="h-7 w-7" />
                    </button>
                </div>

                {rightItems.map(renderNavItem)}
            </div>
        </div>
    )
}
