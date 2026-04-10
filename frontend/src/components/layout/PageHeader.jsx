import { cn } from '@/lib/utils';

export function PageHeader({
    title,
    description,
    actions = null,
    mobileStack = true,
    className,
    titleClassName,
    descriptionClassName,
    actionsClassName,
}) {
    return (
        <header
            className={cn(
                'gap-4',
                mobileStack
                    ? 'flex flex-col md:flex-row md:items-start md:justify-between'
                    : 'flex flex-col sm:flex-row sm:items-center sm:justify-between',
                className
            )}
        >
            <div className="min-w-0 flex-1 space-y-1">
                <h1 className={cn('text-2xl font-bold tracking-tight sm:text-3xl', titleClassName)}>{title}</h1>
                {description && (
                    <p className={cn('max-w-3xl text-sm text-muted-foreground sm:text-base', descriptionClassName)}>
                        {description}
                    </p>
                )}
            </div>

            {actions && <div className={cn('w-full md:w-auto', actionsClassName)}>{actions}</div>}
        </header>
    );
}
