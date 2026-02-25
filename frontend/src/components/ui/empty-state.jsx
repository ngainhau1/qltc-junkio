import { Inbox } from "lucide-react"

export function EmptyState({
    // eslint-disable-next-line no-unused-vars
    icon: Icon = Inbox,
    title = 'Không có dữ liệu',
    description = 'Hiện tại chưa có dữ liệu nào để hiển thị.',
    action
}) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center border-2 border-dashed border-border/60 rounded-2xl bg-muted/10 w-full animate-in fade-in duration-500">
            <div className="h-24 w-24 bg-primary/5 rounded-full flex items-center justify-center mb-6 ring-8 ring-primary/5">
                <Icon className="h-12 w-12 text-primary/40" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground max-w-md mb-6 leading-relaxed">
                {description}
            </p>
            {action && (
                <div className="mt-2 text-center w-full flex justify-center">{action}</div>
            )}
        </div>
    )
}
