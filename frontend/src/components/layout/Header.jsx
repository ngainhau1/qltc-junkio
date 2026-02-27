import { NotificationBell } from "./NotificationBell";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function Header() {
    const { t } = useTranslation();
    const { user } = useSelector(state => state.auth);

    return (
        <header className="sticky top-0 z-40 w-full backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b bg-background/95">
            <div className="flex h-14 items-center justify-end max-w-7xl mx-auto px-4 md:px-8">
                <div className="flex items-center gap-4">
                    <NotificationBell />
                    <Link to="/profile" className="flex items-center gap-3 hover:bg-muted/50 p-1.5 rounded-full transition-colors">
                        <span className="text-sm font-medium hidden md:inline-block">
                            {t('header.hello')} <span className="font-bold">{user?.name || t('header.user')}</span>
                        </span>
                        <img
                            src={user?.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${user?.name || 'demo'}`}
                            alt="Avatar"
                            className="h-8 w-8 rounded-full border bg-muted object-cover"
                        />
                    </Link>
                </div>
            </div>
        </header>
    );
}
