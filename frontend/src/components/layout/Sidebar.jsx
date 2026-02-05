import { Link, useLocation } from "react-router-dom"
import { Home, Wallet, PieChart, Settings, Users, ArrowRightLeft, ChevronsUpDown } from "lucide-react"
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

const sidebarItems = [
    { icon: Home, label: "Dashboard", href: "/" },
    { icon: ArrowRightLeft, label: "Transactions", href: "/transactions" },
    { icon: Wallet, label: "Wallets", href: "/wallets" },
    { icon: PieChart, label: "Reports", href: "/reports" },
    { icon: Users, label: "Family", href: "/family" },
]

export function Sidebar({ className }) {
    const location = useLocation()
    const dispatch = useDispatch()
    const { families, activeFamilyId } = useSelector(state => state.families)

    // Derived state for display
    const activeFamily = families.find(f => f.id === activeFamilyId)
    const contextName = activeFamily ? activeFamily.name : "Personal Workspace"

    return (
        <div className={cn("pb-12 min-h-screen border-r bg-card hidden md:block w-64 fixed left-0 top-0", className)}>
            <div className="space-y-4 py-4">
                <div className="px-3 py-2">
                    <div className="mb-6 px-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="w-full justify-between h-12 border-dashed">
                                    <div className="flex flex-col items-start truncate text-left">
                                        <span className="text-xs text-muted-foreground uppercase font-semibold">Context</span>
                                        <span className="font-bold truncate w-[140px]">{contextName}</span>
                                    </div>
                                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56">
                                <DropdownMenuItem onClick={() => dispatch(setActiveFamily(null))}>
                                    Personal Workspace
                                </DropdownMenuItem>
                                {families.map(family => (
                                    <DropdownMenuItem key={family.id} onClick={() => dispatch(setActiveFamily(family.id))}>
                                        {family.name}
                                    </DropdownMenuItem>
                                ))}
                                <DropdownMenuItem className="text-muted-foreground text-xs pt-2">
                                    <Link to="/family">+ Manage Families</Link>
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
                        Settings
                    </h2>
                    <div className="space-y-1">
                        <Button variant="ghost" className="w-full justify-start gap-2">
                            <Settings className="h-4 w-4" />
                            General
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
