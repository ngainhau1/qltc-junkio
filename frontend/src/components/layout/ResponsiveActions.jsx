import { cn } from '@/lib/utils';

export function ResponsiveActions({
    desktop,
    mobile = null,
    className,
    desktopClassName,
    mobileClassName,
}) {
    return (
        <div className={cn('w-full md:w-auto', className)}>
            {mobile ? <div className={cn('md:hidden', mobileClassName)}>{mobile}</div> : null}
            <div
                className={cn(
                    mobile ? 'hidden md:flex' : 'flex flex-col gap-2 sm:flex-row',
                    'items-stretch gap-2 md:items-center',
                    desktopClassName
                )}
            >
                {desktop}
            </div>
        </div>
    );
}
