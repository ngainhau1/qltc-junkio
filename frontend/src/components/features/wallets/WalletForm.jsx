import { useFormik } from "formik"
import * as Yup from "yup"
import { useDispatch } from "react-redux"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { addWallet } from "@/features/wallets/walletSlice"
// import { v4 as uuidv4 } from 'uuid';

const validationSchema = Yup.object({
    name: Yup.string().required("Wallet Name is required"),
    balance: Yup.number().min(0, "Balance must be positive").required("Initial Balance is required"),
    type: Yup.string().oneOf(['cash', 'bank', 'credit-card', 'e-wallet']).required("Type is required"),
})

export function WalletForm({ onSuccess }) {
    const dispatch = useDispatch()

    const formik = useFormik({
        initialValues: {
            name: '',
            balance: '',
            type: 'cash',
        },
        validationSchema,
        onSubmit: (values) => {
            const newWallet = {
                id: `w-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                name: values.name,
                balance: parseFloat(values.balance).toString(), // Store as string to match existing data
                type: values.type,
                user_id: 'u-1' // Mock Current User ID
            }

            dispatch(addWallet(newWallet))
            if (onSuccess) onSuccess()
        },
    })

    return (
        <form onSubmit={formik.handleSubmit} className="space-y-4">
            <div>
                <label className="text-sm font-medium mb-1 block">Tên Ví</label>
                <Input
                    name="name"
                    placeholder="vd: Vietcombank"
                    value={formik.values.name}
                    onChange={formik.handleChange}
                    className={formik.errors.name ? "border-red-500" : ""}
                />
                {formik.errors.name && <p className="text-xs text-red-500 mt-1">{formik.errors.name}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-medium mb-1 block">Số Dư Ban Đầu</label>
                    <Input
                        name="balance"
                        type="number"
                        placeholder="0"
                        value={formik.values.balance}
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
                        <option value="cash">Tiền Mặt</option>
                        <option value="bank">Tài Khoản Ngân Hàng</option>
                        <option value="credit-card">Thẻ Tín Dụng</option>
                        <option value="e-wallet">Ví Điện Tử</option>
                    </select>
                </div>
            </div>

            <div className="pt-4 flex justify-end gap-2">
                <Button type="submit" className="w-full">Tạo Ví</Button>
            </div>
        </form>
    )
}
