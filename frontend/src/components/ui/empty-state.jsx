import { Inbox } from "lucide-react"
import { useTranslation } from "react-i18next"

export function EmptyState({
    // eslint-disable-next-line no-unused-vars
    icon: Icon = Inbox,
    title,
    description,
    action,
}) {
    const { t } = useTranslation()
    const resolvedTitle = title || t('common.noDataTitle')
    const resolvedDescription = description || t('common.noDataDesc')

    return (
        <div className="flex w-full animate-in fade-in flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/60 bg-muted/10 px-4 py-16 text-center duration-500">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary/5 ring-8 ring-primary/5">
                <Icon className="h-12 w-12 text-primary/40" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-foreground">{resolvedTitle}</h3>
            <p className="mb-6 max-w-md text-sm leading-relaxed text-muted-foreground">
                {resolvedDescription}
            </p>
            {action && <div className="mt-2 flex w-full justify-center text-center">{action}</div>}
        </div>
    )
}
