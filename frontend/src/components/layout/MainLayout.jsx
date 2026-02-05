import { Sidebar } from "./Sidebar"
import { BottomNav } from "./BottomNav"

export function MainLayout({ children }) {
    return (
        <div className="min-h-screen bg-background">
            {/* Desktop Sidebar */}
            <Sidebar />

            {/* Main Content Area */}
            {/* Adds left margin on desktop to account for fixed sidebar */}
            {/* Adds bottom padding on mobile to account for fixed bottom nav */}
            <main className="md:pl-64 pb-16 md:pb-0 min-h-screen transition-all duration-300">
                <div className="container mx-auto p-4 md:p-8 max-w-7xl">
                    {children}
                </div>
            </main>

            {/* Mobile Bottom Nav */}
            <BottomNav />
        </div>
    )
}
