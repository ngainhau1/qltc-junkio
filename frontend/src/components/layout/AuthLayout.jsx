
import { Outlet } from "react-router-dom"

export function AuthLayout() {
    return (
        <div className="flex min-h-screen w-full">
            {/* Left Side: Hero Image / Branding */}
            <div className="hidden lg:flex w-1/2 bg-zinc-900 items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/90 to-black/90 z-10" />
                <img
                    src="/banner.png"
                    alt="Background"
                    className="absolute inset-0 w-full h-full object-cover opacity-30 invert"
                />
                <div className="relative z-20 text-white p-12 max-w-lg">
                    <h1 className="text-4xl font-bold mb-6">Quản lý tài chính cá nhân & gia đình thông minh.</h1>
                    <p className="text-lg text-zinc-300">
                        Theo dõi thu chi, lập ngân sách và đơn giản hóa các khoản nợ gia đình chỉ trong vài bước đơn giản.
                    </p>
                </div>
            </div>

            {/* Right Side: Form Content */}
            <div className="flex-1 flex items-center justify-center p-8 bg-background">
                <div className="w-full max-w-sm space-y-6">
                    <Outlet />
                </div>
            </div>
        </div>
    )
}
