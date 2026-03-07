import { useFormik } from "formik"
import * as Yup from "yup"
import { useDispatch, useSelector } from "react-redux"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { addRule } from "@/features/recurring/recurringSlice"
import { runRecurringEngine } from "@/services/recurringService"
import { store } from "@/store"
import { formatCurrency, generateId } from "@/lib/utils"
import { useTranslation } from "react-i18next"

export function RecurringRuleForm({ onSuccess }) {
    const { t } = useTranslation();

    const validationSchema = Yup.object().shape({
        name: Yup.string().required(t('transactions.recurring.form.validation.nameRequired')),
        amount: Yup.number().positive(t('transactions.recurring.form.validation.amountPositive')).required(t('transactions.recurring.form.validation.amountRequired')),
        frequency: Yup.string().oneOf(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']).required(t('transactions.recurring.form.validation.frequencyRequired')),
        type: Yup.string().oneOf(['EXPENSE', 'INCOME']).required(t('transactions.recurring.form.validation.typeRequired')),
    })
    const dispatch = useDispatch()
    const { wallets } = useSelector(state => state.wallets)
    const { activeFamilyId } = useSelector(state => state.families)

    // Filter wallets based on context
    const contextWallets = wallets.filter(w =>
        activeFamilyId ? w.family_id === activeFamilyId : !w.family_id
    )

    // Select first wallet as default if available
    const defaultWalletId = contextWallets.length > 0 ? contextWallets[0].id : ''

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
                id: generateId('rule'),
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
                <label className="text-sm font-medium mb-1 block">{t('transactions.recurring.form.name')}</label>
                <Input
                    name="name"
                    placeholder={t('transactions.recurring.form.namePlaceholder')}
                    value={formik.values.name}
                    onChange={formik.handleChange}
                    className={formik.errors.name ? "border-red-500" : ""}
                />
                {formik.errors.name && <p className="text-xs text-red-500 mt-1">{formik.errors.name}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-medium mb-1 block">{t('transactions.recurring.form.amount')}</label>
                    <Input
                        name="amount"
                        type="number"
                        placeholder="0"
                        value={formik.values.amount}
                        onChange={formik.handleChange}
                    />
                </div>
                <div>
                    <label className="text-sm font-medium mb-1 block">{t('transactions.recurring.form.type')}</label>
                    <select
                        name="type"
                        className="w-full border rounded-md h-10 px-3 text-sm bg-background"
                        value={formik.values.type}
                        onChange={formik.handleChange}
                    >
                        <option value="EXPENSE">{t('transactions.recurring.form.types.EXPENSE')}</option>
                        <option value="INCOME">{t('transactions.recurring.form.types.INCOME')}</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-medium mb-1 block">{t('transactions.recurring.form.frequency')}</label>
                    <select
                        name="frequency"
                        className="w-full border rounded-md h-10 px-3 text-sm bg-background"
                        value={formik.values.frequency}
                        onChange={formik.handleChange}
                    >
                        <option value="DAILY">{t('transactions.recurring.freq.DAILY')}</option>
                        <option value="WEEKLY">{t('transactions.recurring.freq.WEEKLY')}</option>
                        <option value="MONTHLY">{t('transactions.recurring.freq.MONTHLY')}</option>
                        <option value="YEARLY">{t('transactions.recurring.freq.YEARLY')}</option>
                    </select>
                </div>
                <div>
                    <label className="text-sm font-medium mb-1 block">{t('transactions.recurring.form.startDate')}</label>
                    <Input
                        name="startDate"
                        type="date"
                        value={formik.values.startDate}
                        onChange={formik.handleChange}
                    />
                </div>
            </div>

            <div>
                <label className="text-sm font-medium mb-1 block">{t('transactions.recurring.form.wallet')}</label>
                <select
                    name="walletId"
                    className="w-full border rounded-md h-10 px-3 text-sm bg-background"
                    value={formik.values.walletId}
                    onChange={formik.handleChange}
                >
                    {contextWallets.length === 0 && (
                        <option value="" disabled>Không có ví nào trong mục này</option>
                    )}
                    {contextWallets.map(w => (
                        <option key={w.id} value={w.id}>{w.name} ({formatCurrency(w.balance)})</option>
                    ))}
                </select>
            </div>

            <div className="pt-4 flex justify-end gap-2">
                <Button type="submit" className="w-full">{t('transactions.recurring.form.createBtn')}</Button>
            </div>
        </form>
    )
}
