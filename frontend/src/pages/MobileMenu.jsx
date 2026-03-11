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
    User,
    Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Modal } from "@/components/ui/modal";

export function MobileMenu() {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    const serverUrl = API_URL.replace("/api", "");

    const avatarSrc = user?.avatarUrl?.startsWith("/uploads")
        ? `${serverUrl}${user.avatarUrl}`
        : user?.avatarUrl ||
          `https://api.dicebear.com/7.x/notionists/svg?seed=${user?.name || "demo"}`;

    const confirmLogout = () => {
        dispatch(logout());
        toast.success(t("settings.account.logoutSuccess"));
        setIsLogoutModalOpen(false);
    };

    const menuSections = [
        {
            title: t("nav.features", { defaultValue: "Tính năng" }),
            items: [
                {
                    icon: ArrowRightLeft,
                    label: t("nav.transactions"),
                    href: "/transactions",
                    color: "text-blue-500",
                    bg: "bg-blue-500/10",
                },
                {
                    icon: Target,
                    label: t("nav.goals"),
                    href: "/goals",
                    color: "text-amber-500",
                    bg: "bg-amber-500/10",
                },
                {
                    icon: Repeat,
                    label: t("nav.recurring", { defaultValue: "Giao dịch định kỳ" }),
                    href: "/transactions",
                    color: "text-purple-500",
                    bg: "bg-purple-500/10",
                },
                {
                    icon: PieChart,
                    label: t("nav.reports"),
                    href: "/reports",
                    color: "text-emerald-500",
                    bg: "bg-emerald-500/10",
                },
            ],
        },
        {
            title: t("nav.system", { defaultValue: "Hệ thống" }),
            items: [
                {
                    icon: Bell,
                    label: t("notifications.title", { defaultValue: "Thông báo" }),
                    href: "/notifications",
                    color: "text-orange-500",
                    bg: "bg-orange-500/10",
                },
                {
                    icon: Settings,
                    label: t("nav.settings"),
                    href: "/settings",
                    color: "text-slate-500",
                    bg: "bg-slate-500/10",
                },
            ],
        },
    ];

    return (
        <div className="space-y-6 pb-8">
            {/* Profile Card */}
            <Link
                to="/profile"
                className="flex items-center gap-4 p-5 bg-gradient-to-r from-primary/5 via-primary/10 to-transparent rounded-2xl border border-primary/10 active:scale-[0.98] transition-transform"
            >
                <img
                    src={avatarSrc}
                    alt="Avatar"
                    className="h-16 w-16 rounded-full border-2 border-primary/20 object-cover bg-muted shadow-md"
                />
                <div className="flex-1 min-w-0">
                    <p className="text-lg font-bold truncate">
                        {user?.name || t("header.user")}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                        {user?.email || ""}
                    </p>
                    <p className="text-xs text-primary font-medium mt-1">
                        {t("profile.editBtn", { defaultValue: "Chỉnh sửa hồ sơ" })} →
                    </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
            </Link>

            {/* Menu Sections */}
            {menuSections.map((section, sIdx) => (
                <div key={sIdx}>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-3">
                        {section.title}
                    </h3>
                    <div className="bg-card rounded-2xl border overflow-hidden divide-y divide-border">
                        {section.items.map((item, iIdx) => (
                            <Link
                                key={iIdx}
                                to={item.href}
                                className="flex items-center gap-4 px-4 py-4 hover:bg-muted/50 active:bg-muted transition-colors"
                            >
                                <div
                                    className={`h-10 w-10 rounded-xl ${item.bg} flex items-center justify-center shrink-0`}
                                >
                                    <item.icon className={`h-5 w-5 ${item.color}`} />
                                </div>
                                <span className="flex-1 font-medium text-[15px]">
                                    {item.label}
                                </span>
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </Link>
                        ))}
                    </div>
                </div>
            ))}

            {/* Logout Section */}
            <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-3">
                    {t("settings.tabs.account", { defaultValue: "Tài khoản" })}
                </h3>
                <div className="bg-card rounded-2xl border overflow-hidden">
                    <button
                        onClick={() => setIsLogoutModalOpen(true)}
                        className="flex items-center gap-4 px-4 py-4 w-full hover:bg-destructive/5 active:bg-destructive/10 transition-colors"
                    >
                        <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                            <LogOut className="h-5 w-5 text-destructive" />
                        </div>
                        <span className="flex-1 font-medium text-[15px] text-destructive text-left">
                            {t("settings.account.logoutBtn", { defaultValue: "Đăng xuất" })}
                        </span>
                    </button>
                </div>
            </div>

            {/* App Version */}
            <p className="text-center text-xs text-muted-foreground pt-4">
                Junkio Expense Tracker v2.0
            </p>

            {/* Logout Confirm Modal */}
            <Modal
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
                title={t("settings.account.logoutModalTitle", {
                    defaultValue: "Xác nhận đăng xuất",
                })}
            >
                <div className="py-2 pb-6">
                    <p className="text-muted-foreground">
                        {t("settings.account.logoutModalQ", {
                            defaultValue: "Bạn có chắc chắn muốn đăng xuất khỏi ứng dụng?",
                        })}
                    </p>
                </div>
                <div className="flex items-center justify-end gap-3 border-t pt-4">
                    <Button
                        variant="outline"
                        onClick={() => setIsLogoutModalOpen(false)}
                    >
                        {t("settings.account.stayBtn", { defaultValue: "Ở lại" })}
                    </Button>
                    <Button variant="destructive" onClick={confirmLogout}>
                        {t("settings.account.logoutConfirmBtn", {
                            defaultValue: "Đăng xuất",
                        })}
                    </Button>
                </div>
            </Modal>
        </div>
    );
}
