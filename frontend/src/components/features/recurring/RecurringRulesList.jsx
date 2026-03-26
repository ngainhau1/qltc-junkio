import { useSelector, useDispatch } from "react-redux"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDateString } from "@/lib/utils"
import { Clock, Trash2, Power, PowerOff } from "lucide-react"
import { editRecurring, removeRecurring } from "@/features/recurring/recurringSlice"
import { useTranslation } from "react-i18next"

export function RecurringRulesList() {
    const { t } = useTranslation();
    const { rules } = useSelector(state => state.recurring)
    const dispatch = useDispatch()

    const frequencyMap = {
        'DAILY': t('transactions.recurring.freq.DAILY'),
        'WEEKLY': t('transactions.recurring.freq.WEEKLY'),
        'MONTHLY': t('transactions.recurring.freq.MONTHLY'),
        'YEARLY': t('transactions.recurring.freq.YEARLY')
    }

    if (rules.length === 0) {
        return (
            <div className="text-center py-10 text-muted-foreground">
                <Clock className="mx-auto h-12 w-12 opacity-20 mb-3" />
                <p>{t('transactions.recurring.emptyTitle')}</p>
                <p className="text-sm">{t('transactions.recurring.emptyDesc')}</p>
            </div>
        )
    }

    return (
            <div className="space-y-4">
                {rules.map(rule => (
                <Card key={rule.id} className={rule.active ? "" : "opacity-60 grayscale"}>
                    <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-center gap-4">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-full border ${rule.type === 'EXPENSE' ? 'bg-red-50 border-red-100 text-red-600' : 'bg-green-50 border-green-100 text-green-600'}`}>
                                <Clock className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                                <h3 className="flex flex-wrap items-center gap-2 font-semibold">
                                    {rule.name}
                                    {!rule.active && <span className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">{t('transactions.recurring.paused')}</span>}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {formatCurrency(rule.amount)} • {frequencyMap[rule.frequency] || rule.frequency}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {t('transactions.recurring.due')} {formatDateString(rule.nextDueDate)}
                                </p>
                            </div>
                        </div>

                        <div className="flex w-full items-center gap-2 sm:w-auto">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10"
                                onClick={() => dispatch(editRecurring({ id: rule.id, data: { is_active: !rule.active } }))}
                                title={rule.active ? t('transactions.recurring.pauseBtn') : t('transactions.recurring.activateBtn')}
                            >
                                {rule.active ? <Power className="h-4 w-4 text-green-600" /> : <PowerOff className="h-4 w-4 text-muted-foreground" />}
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 text-red-500 hover:bg-red-50 hover:text-red-600"
                                onClick={() => {
                                    if (confirm(t('transactions.recurring.deleteConfirm'))) {
                                        dispatch(removeRecurring(rule.id))
                                    }
                                }}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
