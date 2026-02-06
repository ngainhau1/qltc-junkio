import { useFormik } from "formik"
import * as Yup from "yup"
import { useDispatch, useSelector } from "react-redux"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { addRule } from "@/features/recurring/recurringSlice"
import { runRecurringEngine } from "@/services/recurringService"
import { store } from "@/store"
import { formatCurrency } from "@/lib/utils"

const validationSchema = Yup.object({
    name: Yup.string().required("Name is required"),
    amount: Yup.number().positive("Amount must be positive").required("Amount is required"),
    frequency: Yup.string().oneOf(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']).required("Frequency is required"),
    type: Yup.string().oneOf(['EXPENSE', 'INCOME']).required("Type is required"),
})

export function RecurringRuleForm({ onSuccess }) {
    const dispatch = useDispatch()
    const { wallets } = useSelector(state => state.wallets)

    // Select first wallet as default if available
    const defaultWalletId = wallets.length > 0 ? wallets[0].id : ''

    const formik = useFormik({
        initialValues: {
            name: '',
            amount: '',
            frequency: 'MONTHLY',
            type: 'EXPENSE',
            walletId: defaultWalletId,
            categoryId: 'general',
            startDate: new Date().toISOString().split('T')[0] // Today YYYY-MM-DD
        },
        validationSchema,
        onSubmit: (values) => {
            const newRule = {
                id: `rule-${Date.now()}`,
                name: values.name,
                amount: parseFloat(values.amount),
                type: values.type,
                frequency: values.frequency,
                startDate: new Date(values.startDate).toISOString(),
                nextDueDate: new Date(values.startDate).toISOString(), // Start immediately (or logic to calc next)
                walletId: values.walletId,
                categoryId: values.categoryId,
                active: true
            }

            dispatch(addRule(newRule))

            // Trigger Engine Check immediately so user sees effect if due today
            runRecurringEngine(store)

            if (onSuccess) onSuccess()
        },
    })

    return (
        <form onSubmit={formik.handleSubmit} className="space-y-4">
            <div>
                <label className="text-sm font-medium mb-1 block">Tên Lịch</label>
                <Input
                    name="name"
                    placeholder="vd: Tiền Thuê Nhà"
                    value={formik.values.name}
                    onChange={formik.handleChange}
                    className={formik.errors.name ? "border-red-500" : ""}
                />
                {formik.errors.name && <p className="text-xs text-red-500 mt-1">{formik.errors.name}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-medium mb-1 block">Số Tiền</label>
                    <Input
                        name="amount"
                        type="number"
                        placeholder="0"
                        value={formik.values.amount}
                        onChange={formik.handleChange}
                    />
                </div>
                <div>
                    <label className="text-sm font-medium mb-1 block">Loại</label>
                    <select
                        name="type"
                        className="w-full border rounded-md h-10 px-3 text-sm bg-background"
                        value={formik.values.type}
                        onChange={formik.handleChange}
                    >
                        <option value="EXPENSE">Chi Tiêu</option>
                        <option value="INCOME">Thu Nhập</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-medium mb-1 block">Tần Suất</label>
                    <select
                        name="frequency"
                        className="w-full border rounded-md h-10 px-3 text-sm bg-background"
                        value={formik.values.frequency}
                        onChange={formik.handleChange}
                    >
                        <option value="DAILY">Hàng Ngày</option>
                        <option value="WEEKLY">Hàng Tuần</option>
                        <option value="MONTHLY">Hàng Tháng</option>
                        <option value="YEARLY">Hàng Năm</option>
                    </select>
                </div>
                <div>
                    <label className="text-sm font-medium mb-1 block">Ngày Bắt Đầu</label>
                    <Input
                        name="startDate"
                        type="date"
                        value={formik.values.startDate}
                        onChange={formik.handleChange}
                    />
                </div>
            </div>

            <div>
                <label className="text-sm font-medium mb-1 block">Ví</label>
                <select
                    name="walletId"
                    className="w-full border rounded-md h-10 px-3 text-sm bg-background"
                    value={formik.values.walletId}
                    onChange={formik.handleChange}
                >
                    {wallets.map(w => (
                        <option key={w.id} value={w.id}>{w.name} ({formatCurrency(w.balance)})</option>
                    ))}
                </select>
            </div>

            <div className="pt-4 flex justify-end gap-2">
                <Button type="submit" className="w-full">Tạo Lịch</Button>
            </div>
        </form>
    )
}
