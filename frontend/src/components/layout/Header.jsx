import { NotificationBell } from "./NotificationBell";
import { useSelector } from "react-redux";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function Header() {
    const { t } = useTranslation();
    const { user } = useSelector(state => state.auth);
    const location = useLocation();

    // Lấy API base để nối url tương đối của ảnh
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const serverUrl = API_URL.replace('/api', '');

    const getPageTitle = () => {
        const path = location.pathname;
        if (path === '/') return t('nav.dashboard');
        if (path.startsWith('/wallets')) return t('nav.wallets');
        if (path.startsWith('/transactions')) return t('nav.transactions');
        if (path.startsWith('/family')) return t('nav.family');
        if (path.startsWith('/goals')) return t('nav.goals');
        if (path.startsWith('/reports')) return t('nav.reports');
        if (path.startsWith('/settings')) return t('nav.settings');
        if (path.startsWith('/profile')) return t('profile.title');
        return '';
    };

    return (
        <header className="sticky top-0 z-40 w-full backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b bg-background/95">
            <div className="flex h-14 items-center justify-between max-w-7xl mx-auto px-4 md:px-8">
                <div className="font-bold text-lg tracking-tight truncate md:hidden">
                    {getPageTitle()}
                </div>
                <div className="flex items-center gap-4 ml-auto">
                    <NotificationBell />
                    <Link to="/profile" className="flex items-center gap-3 hover:bg-muted/50 p-1.5 rounded-full transition-colors">
                        <span className="text-sm font-medium hidden md:inline-block">
                            {t('header.hello')} <span className="font-bold">{user?.name || t('header.user')}</span>
                        </span>
                        <img
                            src={user?.avatarUrl?.startsWith('/uploads') ? `${serverUrl}${user.avatarUrl}` : (user?.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${user?.name || 'demo'}`)}
                            alt="Avatar"
                            className="h-8 w-8 rounded-full border bg-muted object-cover"
                        />
                    </Link>
                </div>
            </div>
        </header>
    );
}
