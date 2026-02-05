import { Home, Wallet, PieChart, User } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
    { icon: Home, label: "Home" },
    { icon: Wallet, label: "Wallets" },
    { icon: PieChart, label: "Reports" },
    { icon: User, label: "Profile" },
]

export function BottomNav({ className }) {
    return (
        <div className={cn("fixed bottom-0 left-0 right-0 border-t bg-background md:hidden z-50", className)}>
            <div className="flex justify-around items-center h-16">
                {navItems.map((item, index) => (
                    <div key={index} className="flex flex-col items-center justify-center space-y-1 text-muted-foreground hover:text-primary cursor-pointer w-full h-full">
                        <item.icon className="h-5 w-5" />
                        <span className="text-[10px] font-medium">{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}
