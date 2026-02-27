import { useFormik } from "formik"
import * as Yup from "yup"
import { useDispatch } from "react-redux"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { addWallet } from "@/features/wallets/walletSlice"
import { useTranslation } from "react-i18next"
// import { v4 as uuidv4 } from 'uuid';

export function WalletForm({ onSuccess }) {
    const { t } = useTranslation();

    const validationSchema = Yup.object().shape({
        name: Yup.string().required(t('wallets.form.validation.nameRequired')),
        balance: Yup.number().min(0, t('wallets.form.validation.balanceMin')).required(t('wallets.form.validation.balanceRequired')),
        type: Yup.string().oneOf(['cash', 'bank', 'credit-card', 'e-wallet']).required(t('wallets.form.validation.typeRequired')),
    })

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
                <label className="text-sm font-medium mb-1 block">{t('wallets.form.name')}</label>
                <Input
                    name="name"
                    placeholder={t('wallets.form.namePlaceholder')}
                    value={formik.values.name}
                    onChange={formik.handleChange}
                    className={formik.errors.name ? "border-red-500" : ""}
                />
                {formik.errors.name && <p className="text-xs text-red-500 mt-1">{formik.errors.name}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-medium mb-1 block">{t('wallets.form.balance')}</label>
                    <Input
                        name="balance"
                        type="number"
                        placeholder="0"
                        value={formik.values.balance}
                        onChange={formik.handleChange}
                    />
                </div>
                <div>
                    <label className="text-sm font-medium mb-1 block">{t('wallets.form.type')}</label>
                    <select
                        name="type"
                        className="w-full border rounded-md h-10 px-3 text-sm bg-background"
                        value={formik.values.type}
                        onChange={formik.handleChange}
                    >
                        <option value="cash">{t('wallets.form.types.cash')}</option>
                        <option value="bank">{t('wallets.form.types.bank')}</option>
                        <option value="credit-card">{t('wallets.form.types.credit-card')}</option>
                        <option value="e-wallet">{t('wallets.form.types.e-wallet')}</option>
                    </select>
                </div>
            </div>

            <div className="pt-4 flex justify-end gap-2">
                <Button type="submit" className="w-full">{t('wallets.form.createBtn')}</Button>
            </div>
        </form>
    )
}
