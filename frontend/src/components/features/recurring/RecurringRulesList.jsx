import { useSelector, useDispatch } from "react-redux"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { Clock, Trash2, Power, PowerOff } from "lucide-react"
import { toggleRule, deleteRule } from "@/features/recurring/recurringSlice"

export function RecurringRulesList({ onEdit }) {
    const { rules } = useSelector(state => state.recurring)
    const dispatch = useDispatch()

    const frequencyMap = {
        'DAILY': 'Hàng Ngày',
        'WEEKLY': 'Hàng Tuần',
        'MONTHLY': 'Hàng Tháng',
        'YEARLY': 'Hàng Năm'
    }

    if (rules.length === 0) {
        return (
            <div className="text-center py-10 text-muted-foreground">
                <Clock className="mx-auto h-12 w-12 opacity-20 mb-3" />
                <p>Chưa có lịch định kỳ nào.</p>
                <p className="text-sm">Tạo lịch để tự động hóa các khoản chi thường xuyên.</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {rules.map(rule => (
                <Card key={rule.id} className={rule.active ? "" : "opacity-60 grayscale"}>
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-full border ${rule.type === 'EXPENSE' ? 'bg-red-50 border-red-100 text-red-600' : 'bg-green-50 border-green-100 text-green-600'}`}>
                                <Clock className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold flex items-center gap-2">
                                    {rule.name}
                                    {!rule.active && <span className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">Đã tạm dừng</span>}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {formatCurrency(rule.amount)} • {frequencyMap[rule.frequency] || rule.frequency}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Đến hạn: {new Date(rule.nextDueDate).toLocaleDateString('vi-VN')}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => dispatch(toggleRule(rule.id))}
                                title={rule.active ? "Tạm dừng" : "Kích hoạt"}
                            >
                                {rule.active ? <Power className="h-4 w-4 text-green-600" /> : <PowerOff className="h-4 w-4 text-muted-foreground" />}
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                onClick={() => {
                                    if (confirm('Bạn có chắc muốn xóa lịch này không?')) {
                                        dispatch(deleteRule(rule.id))
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
