import { Link, useLocation } from "react-router-dom"
import { Home, Wallet, PieChart, Users } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
    { icon: Home, label: "Home", href: "/" },
    { icon: Wallet, label: "Wallets", href: "/wallets" },
    { icon: PieChart, label: "Reports", href: "/reports" },
    { icon: Users, label: "Family", href: "/family" },
]

export function BottomNav({ className }) {
    const location = useLocation()

    return (
        <div className={cn("fixed bottom-0 left-0 right-0 border-t bg-background md:hidden z-50", className)}>
            <div className="flex justify-around items-center h-16">
                {navItems.map((item, index) => {
                    const isActive = location.pathname === item.href
                    return (
                        <Link
                            key={index}
                            to={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center space-y-1 cursor-pointer w-full h-full transition-colors",
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
