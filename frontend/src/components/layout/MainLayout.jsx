import { Sidebar } from "./Sidebar"
import { BottomNav } from "./BottomNav"
import { Outlet } from "react-router-dom"
import { GlobalAddTransactionModal } from "@/components/features/transactions/GlobalAddTransactionModal"
import { Header } from "./Header"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useDispatch } from "react-redux"
import { openAddTransactionModal } from "@/features/ui/uiSlice"

export function MainLayout() {
    const dispatch = useDispatch()

    return (
        <div className="min-h-screen bg-background relative">
            {/* Desktop Sidebar */}
            <Sidebar />

            {/* Main Content Area */}
            {/* Adds left margin on desktop to account for fixed sidebar */}
            {/* Adds bottom padding on mobile to account for fixed bottom nav */}
            <main className="md:pl-64 pb-16 md:pb-0 min-h-screen transition-all duration-300">
                <Header />
                <div className="container mx-auto p-4 md:p-8 max-w-7xl">
                    <Outlet />
                    <GlobalAddTransactionModal />
                </div>
            </main>

            {/* Mobile Bottom Nav */}
            <BottomNav />

            {/* Global FAB for Desktop */}
            <Button
                onClick={() => dispatch(openAddTransactionModal())}
                className="hidden md:flex fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-2xl hover:shadow-primary/50 hover:-translate-y-1 transition-all z-50 p-0 text-white"
                size="icon"
                title="Thêm Giao Dịch"
            >
                <Plus className="h-7 w-7" />
            </Button>
        </div>
    )
}
