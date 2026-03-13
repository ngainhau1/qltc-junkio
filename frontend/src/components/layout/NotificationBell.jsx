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
    selectUnreadCount
} from '@/features/notifications/notificationsSlice';
import { formatDistanceToNow } from 'date-fns';
import { getDateLocale } from '@/lib/utils';
import { createPortal } from 'react-dom';

// Full-screen Notification Sheet for Mobile
function MobileNotificationSheet({ isOpen, onClose, items, unreadCount, dispatch, t }) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] bg-background animate-in slide-in-from-bottom duration-300 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 h-14 border-b bg-background shrink-0">
                <h2 className="text-lg font-bold">{t('notifications.title', { defaultValue: 'Thông báo' })}</h2>
                <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => dispatch(markAllNotificationsRead())}
                            className="text-xs text-primary h-8 px-2"
                        >
                            {t('notifications.markRead', { defaultValue: 'Đánh dấu đã đọc' })}
                        </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-9 w-9 rounded-full">
                        <X className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* Notification List */}
            <div className="flex-1 overflow-y-auto">
                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <Bell className="h-12 w-12 mb-4 opacity-30" />
                        <p className="text-sm">{t('notifications.empty', { defaultValue: 'Không có thông báo nào.' })}</p>
                    </div>
                ) : (
                    <div className="divide-y">
                        {items.map(notif => (
                            <button
                                key={notif.id}
                                className={`flex flex-col items-start p-4 w-full text-left transition-colors active:bg-muted/50 ${(notif.isRead || notif.is_read) ? 'opacity-60' : 'bg-primary/5'}`}
                                onClick={() => {
                                    if (!notif.isRead && !notif.is_read) {
                                        dispatch(markSingleNotificationRead(notif.id));
                                    }
                                }}
                            >
                                <div className="flex justify-between w-full mb-1">
                                    <span className={`font-semibold text-sm ${(!notif.isRead && !notif.is_read) && 'text-foreground'}`}>
                                        {notif.title}
                                    </span>
                                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                                        {(notif.created_at || notif.createdAt)
                                            ? formatDistanceToNow(new Date(notif.created_at || notif.createdAt), { addSuffix: true, locale: getDateLocale() })
                                            : ''}
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground w-full">{notif.message}</p>
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
    const { items } = useSelector(state => state.notifications);
    const { isAuthenticated } = useSelector(state => state.auth);
    const unreadCount = useSelector(selectUnreadCount);
    const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
            dispatch(fetchNotifications());
        }
    }, [dispatch, isAuthenticated]);

    // Check if mobile
    const handleBellClick = () => {
        if (window.innerWidth < 768) {
            setIsMobileSheetOpen(true);
        }
    };

    return (
        <>
            {/* Desktop: Dropdown */}
            <div className="hidden md:block">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative">
                            <Bell className="h-5 w-5" />
                            {unreadCount > 0 && (
                                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                                    {unreadCount}
                                </span>
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80">
                        <div className="flex items-center justify-between px-4 py-2 border-b">
                            <span className="font-semibold">{t('notifications.title')}</span>
                            {unreadCount > 0 && (
                                <Button variant="ghost" size="sm" onClick={() => dispatch(markAllNotificationsRead())} className="text-xs text-primary h-auto py-1 px-2">
                                    {t('notifications.markRead')}
                                </Button>
                            )}
                        </div>
                        <div className="max-h-[300px] overflow-y-auto">
                            {items.length === 0 ? (
                                <div className="p-4 text-center text-sm text-muted-foreground">{t('notifications.empty')}</div>
                            ) : (
                                items.map(notif => (
                                    <DropdownMenuItem
                                        key={notif.id}
                                        className={`flex flex-col items-start p-4 cursor-pointer border-b last:border-0 ${(notif.isRead || notif.is_read) ? 'opacity-70' : 'bg-muted/30'}`}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            if (!notif.isRead && !notif.is_read) {
                                                dispatch(markSingleNotificationRead(notif.id));
                                            }
                                        }}
                                    >
                                        <div className="flex justify-between w-full mb-1">
                                            <span className={`font-medium text-sm ${(!notif.isRead && !notif.is_read) && 'text-foreground'}`}>{notif.title}</span>
                                            <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                                                {(notif.created_at || notif.createdAt)
                                                    ? formatDistanceToNow(new Date(notif.created_at || notif.createdAt), { addSuffix: true, locale: getDateLocale() })
                                                    : ''}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground line-clamp-2 text-left w-full">{notif.message}</p>
                                    </DropdownMenuItem>
                                ))
                            )}
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Mobile: Full-screen Sheet */}
            <div className="md:hidden">
                <Button variant="ghost" size="icon" className="relative h-10 w-10" onClick={handleBellClick}>
                    <Bell className="h-6 w-6" />
                    {unreadCount > 0 && (
                        <span className="absolute top-0.5 right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
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
