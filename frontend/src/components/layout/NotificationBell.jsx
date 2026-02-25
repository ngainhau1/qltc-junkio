import { useSelector, useDispatch } from 'react-redux';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { markAsRead, markAllAsRead, selectUnreadCount } from '@/features/notifications/notificationsSlice';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

export function NotificationBell() {
    const dispatch = useDispatch();
    const { items } = useSelector(state => state.notifications);
    const unreadCount = useSelector(selectUnreadCount);

    return (
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
                    <span className="font-semibold">Thông báo</span>
                    {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" onClick={() => dispatch(markAllAsRead())} className="text-xs text-primary h-auto py-1 px-2">
                            Đánh dấu đã đọc
                        </Button>
                    )}
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                    {items.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">Không có thông báo nào</div>
                    ) : (
                        items.map(notif => (
                            <DropdownMenuItem
                                key={notif.id}
                                className={`flex flex-col items-start p-4 cursor-pointer border-b last:border-0 ${notif.isRead ? 'opacity-70' : 'bg-muted/30'}`}
                                onClick={(e) => {
                                    e.preventDefault(); // keep dropdown open when clicking read
                                    dispatch(markAsRead(notif.id));
                                }}
                            >
                                <div className="flex justify-between w-full mb-1">
                                    <span className={`font-medium text-sm ${!notif.isRead && 'text-foreground'}`}>{notif.title}</span>
                                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                                        {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: vi })}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-2 text-left w-full">{notif.message}</p>
                            </DropdownMenuItem>
                        ))
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
