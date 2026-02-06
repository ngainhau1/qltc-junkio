import { useFormik } from "formik"
import * as Yup from "yup"
import { useDispatch, useSelector } from "react-redux"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { addTransaction } from "@/features/transactions/transactionSlice"
import { decreaseBalance, increaseBalance } from "@/features/wallets/walletSlice"
import { formatCurrency } from "@/lib/utils"

const validationSchema = Yup.object({
    description: Yup.string().required("Description is required"),
    amount: Yup.number().positive("Amount must be positive").required("Amount is required"),
    date: Yup.date().required("Date is required"),
    type: Yup.string().oneOf(['EXPENSE', 'INCOME']).required("Type is required"),
    walletId: Yup.string().required("Wallet is required"),
    categoryId: Yup.string().required("Category is required"),
})

export function TransactionForm({ onSuccess }) {
    const dispatch = useDispatch()
    const { wallets } = useSelector(state => state.wallets)

    // Select first wallet as default if available
    const defaultWalletId = wallets.length > 0 ? wallets[0].id : ''

    const formik = useFormik({
        initialValues: {
            description: '',
            amount: '',
            date: new Date().toISOString().split('T')[0], // Today YYYY-MM-DD
            type: 'EXPENSE',
            walletId: defaultWalletId,
            categoryId: 'general',
        },
        validationSchema,
        onSubmit: (values) => {
            const newTransaction = {
                id: `t-${Date.now()}`,
                description: values.description,
                amount: parseFloat(values.amount),
                date: new Date(values.date).toISOString(),
                // Support both standard date key and legacy if needed
                transaction_date: new Date(values.date).toISOString(),
                type: values.type,
                wallet_id: values.walletId,
                category_id: values.categoryId,
                created_at: new Date().toISOString()
            }

            // 1. Add Transaction
            dispatch(addTransaction(newTransaction))

            // 2. Update Wallet Balance
            if (values.type === 'EXPENSE') {
                dispatch(decreaseBalance({ id: values.walletId, amount: values.amount }))
            } else {
                dispatch(increaseBalance({ id: values.walletId, amount: values.amount }))
            }

            if (onSuccess) onSuccess()
        },
    })

    return (
        <form onSubmit={formik.handleSubmit} className="space-y-4">
            <div>
                <label className="text-sm font-medium mb-1 block">Mô Tả</label>
                <Input
                    name="description"
                    placeholder="vd: Ăn trưa tại Circle K"
                    value={formik.values.description}
                    onChange={formik.handleChange}
                    className={formik.errors.description ? "border-red-500" : ""}
                />
                {formik.errors.description && <p className="text-xs text-red-500 mt-1">{formik.errors.description}</p>}
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
                        <option value="EXPENSE">Chi Tiêu (-)</option>
                        <option value="INCOME">Thu Nhập (+)</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-medium mb-1 block">Ngày</label>
                    <Input
                        name="date"
                        type="date"
                        value={formik.values.date}
                        onChange={formik.handleChange}
                    />
                </div>
                <div>
                    <label className="text-sm font-medium mb-1 block">Danh Mục</label>
                    <select
                        name="categoryId"
                        className="w-full border rounded-md h-10 px-3 text-sm bg-background block"
                        value={formik.values.categoryId}
                        onChange={formik.handleChange}
                    >
                        <option value="general">Chung</option>
                        <option value="food">Ăn Uống</option>
                        <option value="transport">Di Chuyển</option>
                        <option value="shopping">Mua Sắm</option>
                        <option value="utilities">Hóa Đơn & Tiện Ích</option>
                        <option value="entertainment">Giải Trí</option>
                        <option value="health">Sức Khỏe</option>
                        <option value="income">Lương / Thu Nhập</option>
                    </select>
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
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">Thêm Giao Dịch</Button>
            </div>
        </form>
    )
}
