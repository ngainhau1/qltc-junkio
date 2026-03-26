import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { logout } from "@/features/auth/authSlice";
import { toast } from "sonner";
import {
    Target,
    PieChart,
    Settings,
    LogOut,
    ChevronRight,
    ArrowRightLeft,
    Repeat,
    Bell,
    TrendingUp,
    Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Modal } from "@/components/ui/modal";

export function MobileMenu() {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL || '/api';
    const serverUrl = API_URL.replace("/api", "");

    const avatarSrc = user?.avatarUrl?.startsWith("/uploads")
        ? `${serverUrl}${user.avatarUrl}`
        : user?.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${user?.name || "demo"}`;

    const confirmLogout = () => {
        dispatch(logout());
        toast.success(t("settings.account.logoutSuccess"));
        setIsLogoutModalOpen(false);
    };

    const menuSections = [
        {
            title: t("nav.features"),
            items: [
                { icon: ArrowRightLeft, label: t("nav.transactions"), href: "/transactions", color: "text-blue-500", bg: "bg-blue-500/10" },
                { icon: Target, label: t("nav.goals"), href: "/goals", color: "text-amber-500", bg: "bg-amber-500/10" },
                { icon: Repeat, label: t("nav.recurring"), href: "/transactions", color: "text-purple-500", bg: "bg-purple-500/10" },
                { icon: PieChart, label: t("nav.reports"), href: "/reports", color: "text-emerald-500", bg: "bg-emerald-500/10" },
                { icon: TrendingUp, label: t("nav.forecast"), href: "/forecast", color: "text-cyan-500", bg: "bg-cyan-500/10" },
                ...(user?.role === "admin"
                    ? [{ icon: Shield, label: t("nav.admin"), href: "/admin", color: "text-red-500", bg: "bg-red-500/10" }]
                    : []),
            ],
        },
        {
            title: t("nav.system"),
            items: [
                { icon: Bell, label: t("notifications.title"), href: "/notifications", color: "text-orange-500", bg: "bg-orange-500/10" },
                { icon: Settings, label: t("nav.settings"), href: "/settings", color: "text-slate-500", bg: "bg-slate-500/10" },
            ],
        },
    ];

    return (
        <div className="space-y-6 pb-8">
            <Link
                to="/profile"
                className="flex items-center gap-4 rounded-2xl border border-primary/10 bg-gradient-to-r from-primary/5 via-primary/10 to-transparent p-5 transition-transform active:scale-[0.98]"
            >
                <img
                    src={avatarSrc}
                    alt="Avatar"
                    className="h-16 w-16 rounded-full border-2 border-primary/20 bg-muted object-cover shadow-md"
                />
                <div className="min-w-0 flex-1">
                    <p className="truncate text-lg font-bold">{user?.name || t("header.user")}</p>
                    <p className="truncate text-sm text-muted-foreground">{user?.email || ""}</p>
                    <p className="mt-1 text-xs font-medium text-primary">{t("profile.editBtn")} ?</p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
            </Link>

            {menuSections.map((section, sectionIndex) => (
                <div key={sectionIndex}>
                    <h3 className="mb-3 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {section.title}
                    </h3>
                    <div className="overflow-hidden rounded-2xl border bg-card divide-y divide-border">
                        {section.items.map((item, itemIndex) => (
                            <Link
                                key={itemIndex}
                                to={item.href}
                                className="flex items-center gap-4 px-4 py-4 transition-colors hover:bg-muted/50 active:bg-muted"
                            >
                                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.bg}`}>
                                    <item.icon className={`h-5 w-5 ${item.color}`} />
                                </div>
                                <span className="flex-1 font-medium text-[15px]">{item.label}</span>
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </Link>
                        ))}
                    </div>
                </div>
            ))}

            <div>
                <h3 className="mb-3 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("settings.tabs.account")}
                </h3>
                <div className="overflow-hidden rounded-2xl border bg-card">
                    <button
                        onClick={() => setIsLogoutModalOpen(true)}
                        className="flex w-full items-center gap-4 px-4 py-4 transition-colors hover:bg-destructive/5 active:bg-destructive/10"
                    >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10">
                            <LogOut className="h-5 w-5 text-destructive" />
                        </div>
                        <span className="flex-1 text-left text-[15px] font-medium text-destructive">
                            {t("settings.account.logoutBtn")}
                        </span>
                    </button>
                </div>
            </div>

            <p className="pt-4 text-center text-xs text-muted-foreground">
                {t('common.appVersion', { version: '2.0' })}
            </p>

            <Modal
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
                title={t("settings.account.logoutModalTitle")}
            >
                <div className="py-2 pb-6">
                    <p className="text-muted-foreground">{t("settings.account.logoutModalQ")}</p>
                </div>
                <div className="flex items-center justify-end gap-3 border-t pt-4">
                    <Button variant="outline" onClick={() => setIsLogoutModalOpen(false)}>
                        {t("settings.account.stayBtn")}
                    </Button>
                    <Button variant="destructive" onClick={confirmLogout}>
                        {t("settings.account.logoutConfirmBtn")}
                    </Button>
                </div>
            </Modal>
        </div>
    );
}
