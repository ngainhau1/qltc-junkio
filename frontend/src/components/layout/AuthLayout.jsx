import { Outlet, Link } from "react-router-dom"
import { Wallet } from "lucide-react"
import { useTranslation } from "react-i18next"

export function AuthLayout() {
    const { t } = useTranslation();
    return (
        <div className="flex min-h-screen w-full font-sans">
            {/* Left Side: Branding & Quote */}
            <div className="hidden lg:flex w-1/2 bg-zinc-950 text-white flex-col justify-between p-12 relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10"
                    style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}>
                </div>
                {/* Gradient Overlay */}
                <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-emerald-900/50 to-transparent z-0" />

                <div className="relative z-10 font-bold text-2xl flex items-center gap-2">
                    <Wallet className="h-8 w-8 text-emerald-500" />
                    Junkio Tracker
                </div>

                <div className="relative z-10 space-y-6 max-w-lg mb-12">
                    <h1 className="text-5xl font-extrabold tracking-tight leading-[1.1]">
                        {t('auth.bannerTitle1')}<br />
                        <span className="text-emerald-400">{t('auth.bannerTitle2')}</span>
                    </h1>
                    <p className="text-zinc-400 text-lg leading-relaxed">
                        {t('auth.bannerDesc')}
                    </p>

                    <div className="pt-8 flex items-center gap-4">
                        <div className="flex -space-x-4">
                            {[1, 2, 3, 4].map((i) => (
                                <img key={i} className="w-10 h-10 border-2 border-zinc-950 rounded-full bg-zinc-800 object-cover" src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`} alt="user avatar" />
                            ))}
                        </div>
                        <p className="text-sm font-medium text-zinc-300">
                            {t('auth.bannerTrust')}
                        </p>
                    </div>
                </div>

                <div className="relative z-10 text-zinc-500 text-sm">
                    {t('auth.bannerCopyright')}
                </div>
            </div>

            {/* Right Side: Form Content */}
            <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-12 bg-background relative">
                {/* Mobile Logo Only */}
                <div className="flex lg:hidden justify-center items-center gap-2 mb-8 font-bold text-xl">
                    <Wallet className="h-6 w-6 text-emerald-500" />
                    Junkio Tracker
                </div>
                <div className="w-full max-w-sm mx-auto">
                    <Outlet />
                </div>
            </div>
        </div>
    )
}
