import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    markAllNotificationsRead,
    markSingleNotificationRead,
    fetchNotifications,
    selectUnreadCount,
} from '@/features/notifications/notificationsSlice';
import { formatDistanceToNow } from 'date-fns';
import { getDateLocale } from '@/lib/utils';
import { createPortal } from 'react-dom';

function MobileNotificationSheet({ isOpen, onClose, items, unreadCount, dispatch, t }) {
    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : 'unset';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex flex-col bg-background animate-in slide-in-from-bottom duration-300">
            <div className="flex h-14 shrink-0 items-center justify-between border-b bg-background px-4">
                <h2 className="text-lg font-bold">{t('notifications.title')}</h2>
                <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => dispatch(markAllNotificationsRead())}
                            className="h-8 px-2 text-xs text-primary"
                        >
                            {t('notifications.markRead')}
                        </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-9 w-9 rounded-full">
                        <X className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {items.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                        <Bell className="mb-4 h-12 w-12 opacity-30" />
                        <p className="text-sm">{t('notifications.empty')}</p>
                    </div>
                ) : (
                    <div className="divide-y">
                        {items.map((notif) => (
                            <button
                                key={notif.id}
                                className={`flex w-full flex-col items-start p-4 text-left transition-colors active:bg-muted/50 ${(notif.isRead || notif.is_read) ? 'opacity-60' : 'bg-primary/5'}`}
                                onClick={() => {
                                    if (!notif.isRead && !notif.is_read) {
                                        dispatch(markSingleNotificationRead(notif.id));
                                    }
                                }}
                            >
                                <div className="mb-1 flex w-full justify-between">
                                    <span className={`text-sm font-semibold ${(!notif.isRead && !notif.is_read) && 'text-foreground'}`}>
                                        {notif.title}
                                    </span>
                                    <span className="ml-2 whitespace-nowrap text-xs text-muted-foreground">
                                        {(notif.created_at || notif.createdAt)
                                            ? formatDistanceToNow(new Date(notif.created_at || notif.createdAt), { addSuffix: true, locale: getDateLocale() })
                                            : ''}
                                    </span>
                                </div>
                                <p className="w-full text-sm text-muted-foreground">{notif.message}</p>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}

export function NotificationBell() {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const { items } = useSelector((state) => state.notifications);
    const { isAuthenticated } = useSelector((state) => state.auth);
    const unreadCount = useSelector(selectUnreadCount);
    const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
            dispatch(fetchNotifications());
        }
    }, [dispatch, isAuthenticated]);

    const handleBellClick = () => {
        if (window.innerWidth < 768) {
            setIsMobileSheetOpen(true);
        }
    };

    return (
        <>
            <div className="hidden md:block">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative" aria-label={t('notifications.title')}>
                            <Bell className="h-5 w-5" />
                            {unreadCount > 0 && (
                                <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                                    {unreadCount}
                                </span>
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80">
                        <div className="flex items-center justify-between border-b px-4 py-2">
                            <span className="font-semibold">{t('notifications.title')}</span>
                            {unreadCount > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => dispatch(markAllNotificationsRead())}
                                    className="h-auto px-2 py-1 text-xs text-primary"
                                >
                                    {t('notifications.markRead')}
                                </Button>
                            )}
                        </div>
                        <div className="max-h-[300px] overflow-y-auto">
                            {items.length === 0 ? (
                                <div className="p-4 text-center text-sm text-muted-foreground">{t('notifications.empty')}</div>
                            ) : (
                                items.map((notif) => (
                                    <DropdownMenuItem
                                        key={notif.id}
                                        className={`flex cursor-pointer flex-col items-start border-b p-4 last:border-0 ${(notif.isRead || notif.is_read) ? 'opacity-70' : 'bg-muted/30'}`}
                                        onClick={(event) => {
                                            event.preventDefault();
                                            if (!notif.isRead && !notif.is_read) {
                                                dispatch(markSingleNotificationRead(notif.id));
                                            }
                                        }}
                                    >
                                        <div className="mb-1 flex w-full justify-between">
                                            <span className={`text-sm font-medium ${(!notif.isRead && !notif.is_read) && 'text-foreground'}`}>{notif.title}</span>
                                            <span className="ml-2 whitespace-nowrap text-xs text-muted-foreground">
                                                {(notif.created_at || notif.createdAt)
                                                    ? formatDistanceToNow(new Date(notif.created_at || notif.createdAt), { addSuffix: true, locale: getDateLocale() })
                                                    : ''}
                                            </span>
                                        </div>
                                        <p className="w-full text-left text-xs text-muted-foreground line-clamp-2">{notif.message}</p>
                                    </DropdownMenuItem>
                                ))
                            )}
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="md:hidden">
                <Button variant="ghost" size="icon" className="relative h-10 w-10" onClick={handleBellClick} aria-label={t('notifications.title')}>
                    <Bell className="h-6 w-6" />
                    {unreadCount > 0 && (
                        <span className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                            {unreadCount}
                        </span>
                    )}
                </Button>
                <MobileNotificationSheet
                    isOpen={isMobileSheetOpen}
                    onClose={() => setIsMobileSheetOpen(false)}
                    items={items}
                    unreadCount={unreadCount}
                    dispatch={dispatch}
                    t={t}
                />
            </div>
        </>
    );
}
