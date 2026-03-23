import { Sidebar } from "./Sidebar"
import { BottomNav } from "./BottomNav"
import { Outlet } from "react-router-dom"
import { GlobalAddTransactionModal } from "@/components/features/transactions/GlobalAddTransactionModal"
import { Header } from "./Header"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useDispatch } from "react-redux"
import { openAddTransactionModal } from "@/features/ui/uiSlice"
import { useTranslation } from "react-i18next"

export function MainLayout() {
    const { t } = useTranslation()
    const dispatch = useDispatch()

    return (
        <div className="relative min-h-screen bg-background">
            <Sidebar />

            <main className="min-h-screen pb-28 transition-all duration-300 md:pb-8 md:pl-64">
                <Header />
                <div className="container mx-auto max-w-7xl p-4 md:p-8">
                    <Outlet />
                    <GlobalAddTransactionModal />
                </div>
            </main>

            <BottomNav />

            <Button
                onClick={() => dispatch(openAddTransactionModal())}
                className="fixed bottom-8 right-8 z-50 hidden h-14 w-14 rounded-full p-0 text-white shadow-2xl transition-all hover:-translate-y-1 hover:shadow-primary/50 md:flex"
                size="icon"
                title={t('sidebar.addTransaction')}
            >
                <Plus className="h-7 w-7" />
            </Button>
        </div>
    )
}
