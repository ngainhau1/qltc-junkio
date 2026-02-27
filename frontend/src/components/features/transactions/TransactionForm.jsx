import { useFormik } from "formik"
import * as Yup from "yup"
import { useDispatch, useSelector } from "react-redux"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { addTransaction } from "@/features/transactions/transactionSlice"
import { decreaseBalance, increaseBalance } from "@/features/wallets/walletSlice"
import { formatCurrency } from "@/lib/utils"
import { ArrowRight } from "lucide-react"
import { useTranslation } from "react-i18next"

const createYupSchema = (t) => Yup.object({
    description: Yup.string().required(t('transactionForm.validations.reqDesc')),
    amount: Yup.number().positive(t('transactionForm.validations.posAmount')).required(t('transactionForm.validations.reqAmount')),
    date: Yup.date().required(t('transactionForm.validations.reqDate')),
    type: Yup.string().oneOf(['EXPENSE', 'INCOME', 'TRANSFER']).required(t('transactionForm.validations.reqType')),
    walletId: Yup.string().required(t('transactionForm.validations.reqWallet')),
    categoryId: Yup.string().when('type', {
        is: (type) => type !== 'TRANSFER',
        then: (schema) => schema.required(t('transactionForm.validations.reqCategory')),
        otherwise: (schema) => schema.notRequired()
    }),
    destinationWalletId: Yup.string().when('type', {
        is: 'TRANSFER',
        then: (schema) => schema.required(t('transactionForm.validations.reqDestWallet')).notOneOf([Yup.ref('walletId')], t('transactionForm.validations.diffWallet')),
        otherwise: (schema) => schema.notRequired()
    })
})

export function TransactionForm({ onSuccess }) {
    const { t } = useTranslation()
    const dispatch = useDispatch()
    const { wallets } = useSelector(state => state.wallets)

    // Select first wallet as default if available
    const defaultWalletId = wallets.length > 0 ? wallets[0].id : ''
    // Select second wallet as default destination if available
    const defaultDestWalletId = wallets.length > 1 ? wallets[1].id : ''

    const formik = useFormik({
        initialValues: {
            description: '',
            amount: '',
            date: new Date().toISOString().split('T')[0], // Today YYYY-MM-DD
            type: 'EXPENSE',
            walletId: defaultWalletId,
            destinationWalletId: defaultDestWalletId,
            categoryId: 'general',
        },
        validationSchema: createYupSchema(t),
        onSubmit: (values) => {
            const newTransaction = {
                id: `t-${Date.now()}`,
                description: values.description,
                amount: parseFloat(values.amount),
                date: new Date(values.date).toISOString(),
                transaction_date: new Date(values.date).toISOString(),
                type: values.type,
                wallet_id: values.walletId,
                category_id: values.type === 'TRANSFER' ? null : values.categoryId,
                destination_wallet_id: values.type === 'TRANSFER' ? values.destinationWalletId : null,
                created_at: new Date().toISOString()
            }

            // 1. Add Transaction
            dispatch(addTransaction(newTransaction))

            // 2. Update Wallet Balance
            if (values.type === 'EXPENSE') {
                dispatch(decreaseBalance({ id: values.walletId, amount: values.amount }))
            } else if (values.type === 'INCOME') {
                dispatch(increaseBalance({ id: values.walletId, amount: values.amount }))
            } else if (values.type === 'TRANSFER') {
                // Deduct from Source
                dispatch(decreaseBalance({ id: values.walletId, amount: values.amount }))
                // Add to Destination
                dispatch(increaseBalance({ id: values.destinationWalletId, amount: values.amount }))
            }

            if (onSuccess) onSuccess()
        },
    })

    const handleTabChange = (value) => {
        formik.setFieldValue('type', value)
    }

    return (
        <form onSubmit={formik.handleSubmit} className="space-y-4" data-testid={`form-${formik.values.type}`}>
            <Tabs defaultValue="EXPENSE" onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-4">
                    <TabsTrigger value="EXPENSE">{t('transactionForm.tabs.expense')}</TabsTrigger>
                    <TabsTrigger value="INCOME">{t('transactionForm.tabs.income')}</TabsTrigger>
                    <TabsTrigger value="TRANSFER">{t('transactionForm.tabs.transfer')}</TabsTrigger>
                </TabsList>
            </Tabs>

            <div className="space-y-4">
                {/* Amount */}
                <div>
                    <label className="text-sm font-medium mb-1 block">{t('transactionForm.amount')}</label>
                    <Input
                        name="amount"
                        type="number"
                        placeholder="0"
                        value={formik.values.amount}
                        onChange={formik.handleChange}
                        className={formik.errors.amount && formik.touched.amount ? "border-red-500" : ""}
                    />
                    {formik.errors.amount && formik.touched.amount && <p className="text-xs text-red-500 mt-1">{formik.errors.amount}</p>}
                </div>

                {/* Wallets & Transfer Logic */}
                {formik.values.type === 'TRANSFER' ? (
                    <div className="grid grid-cols-[1fr,auto,1fr] gap-2 items-center">
                        <div>
                            <label className="text-sm font-medium mb-1 block">{t('transactionForm.fromWallet')}</label>
                            <select
                                name="walletId"
                                className="w-full border rounded-md h-10 px-3 text-sm bg-background"
                                value={formik.values.walletId}
                                onChange={formik.handleChange}
                            >
                                {wallets.map(w => (
                                    <option key={w.id} value={w.id}>{w.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="pt-6 text-muted-foreground">
                            <ArrowRight className="h-4 w-4" />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1 block">{t('transactionForm.toWallet')}</label>
                            <select
                                name="destinationWalletId"
                                className="w-full border rounded-md h-10 px-3 text-sm bg-background"
                                value={formik.values.destinationWalletId}
                                onChange={formik.handleChange}
                                data-testid="dest-wallet-select"
                            >
                                <option value="" disabled>{t('transactionForm.selectWallet')}</option>
                                {wallets.filter(w => w.id !== formik.values.walletId).map(w => (
                                    <option key={w.id} value={w.id}>{w.name}</option>
                                ))}
                            </select>
                            {formik.errors.destinationWalletId && formik.touched.destinationWalletId && <p className="text-xs text-red-500 mt-1">{formik.errors.destinationWalletId}</p>}
                        </div>
                    </div>
                ) : (
                    <div>
                        <label className="text-sm font-medium mb-1 block">{t('transactionForm.wallet')}</label>
                        <select
                            name="walletId"
                            className="w-full border rounded-md h-10 px-3 text-sm bg-background"
                            value={formik.values.walletId}
                            onChange={formik.handleChange}
                            data-testid="source-wallet-select"
                        >
                            {wallets.map(w => (
                                <option key={w.id} value={w.id}>{w.name} ({formatCurrency(w.balance)})</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Description & Category */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium mb-1 block">{t('transactionForm.description')}</label>
                        <Input
                            name="description"
                            placeholder={formik.values.type === 'TRANSFER' ? t('transactionForm.descPlaceholderTransfer') : t('transactionForm.descPlaceholderDefault')}
                            value={formik.values.description}
                            onChange={formik.handleChange}
                            className={formik.errors.description && formik.touched.description ? "border-red-500" : ""}
                        />
                        {formik.errors.description && formik.touched.description && <p className="text-xs text-red-500 mt-1">{formik.errors.description}</p>}
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-1 block">{t('transactionForm.date')}</label>
                        <Input
                            name="date"
                            type="date"
                            value={formik.values.date}
                            onChange={formik.handleChange}
                        />
                    </div>
                </div>

                {formik.values.type !== 'TRANSFER' && (
                    <div>
                        <label className="text-sm font-medium mb-1 block">{t('transactionForm.category')}</label>
                        <select
                            name="categoryId"
                            className="w-full border rounded-md h-10 px-3 text-sm bg-background block"
                            value={formik.values.categoryId}
                            onChange={formik.handleChange}
                        >
                            <option value="general">{t('transactionForm.categories.general')}</option>
                            <option value="food">{t('transactionForm.categories.food')}</option>
                            <option value="transport">{t('transactionForm.categories.transport')}</option>
                            <option value="shopping">{t('transactionForm.categories.shopping')}</option>
                            <option value="utilities">{t('transactionForm.categories.utilities')}</option>
                            <option value="entertainment">{t('transactionForm.categories.entertainment')}</option>
                            <option value="health">{t('transactionForm.categories.health')}</option>
                            <option value="income">{t('transactionForm.categories.income')}</option>
                        </select>
                    </div>
                )}
            </div>

            <div className="pt-4 flex justify-end gap-2">
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                    {formik.values.type === 'TRANSFER' ? t('transactionForm.submitTransfer') : t('transactionForm.submitAdd')}
                </Button>
            </div>
        </form>
    )
}
