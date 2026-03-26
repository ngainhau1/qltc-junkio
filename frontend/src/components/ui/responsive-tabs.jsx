import { cn } from '@/lib/utils';

export function ResponsiveTabs({ items, value, onChange, className, triggerClassName }) {
    return (
        <div className={cn('scrollbar-hidden overflow-x-auto pb-1', className)}>
            <div className="inline-flex min-w-full gap-1 rounded-lg bg-muted p-1 md:min-w-0 md:w-fit">
                {items.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.value === value;

                    return (
                        <button
                            key={item.value}
                            type="button"
                            onClick={() => onChange(item.value)}
                            className={cn(
                                'touch-target inline-flex min-w-[124px] shrink-0 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all',
                                isActive
                                    ? 'border border-border bg-background text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:bg-background/60 hover:text-foreground',
                                triggerClassName
                            )}
                        >
                            {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
                            <span className="truncate">{item.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
