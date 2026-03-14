import { useFormik } from "formik"
import * as Yup from "yup"
import { useDispatch, useSelector } from "react-redux"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createTransaction } from "@/features/transactions/transactionSlice"
import { fetchCategories } from "@/features/categories/categorySlice"
import { addNotification } from "@/features/notifications/notificationsSlice"
import { formatCurrency } from "@/lib/utils"
import { ArrowRight } from "lucide-react"
import { useTranslation } from "react-i18next"

const createYupSchema = (t) => Yup.object({
    description: Yup.string().required(t('transactionForm.validations.reqDesc')),
    amount: Yup.number().positive(t('transactionForm.validations.posAmount')).required(t('transactionForm.validations.reqAmount')),
    date: Yup.date().required(t('transactionForm.validations.reqDate')),
    type: Yup.string().oneOf(['EXPENSE', 'INCOME', 'TRANSFER']).required(t('transactionForm.validations.reqType')),
    walletId: Yup.string().required(t('transactionForm.validations.reqWallet')),
    categoryId: Yup.string().notRequired(),
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
    const { activeFamilyId } = useSelector(state => state.families)
    const { categories } = useSelector(state => state.categories)

    // Fetch categories khi mount
    useEffect(() => {
        dispatch(fetchCategories());
    }, [dispatch]);

    // Filter wallets based on context
    const contextWallets = wallets.filter(w =>
        activeFamilyId ? w.family_id === activeFamilyId : !w.family_id
    )

    const { transactions } = useSelector(state => state.transactions)

    // Select first wallet as default if available
    const defaultWalletId = contextWallets.length > 0 ? contextWallets[0].id : ''
    // Select second wallet as default destination if available
    const defaultDestWalletId = contextWallets.length > 1 ? contextWallets[1].id : ''

    const formik = useFormik({
        initialValues: {
            description: '',
            amount: '',
            date: new Date().toISOString().split('T')[0], // Today YYYY-MM-DD
            type: 'EXPENSE',
            walletId: defaultWalletId,
            destinationWalletId: defaultDestWalletId,
            categoryId: '',  // sẽ được set khi categories load
        },
        validationSchema: createYupSchema(t),
        onSubmit: async (values) => {
            const newTransaction = {
                description: values.description,
                amount: parseFloat(values.amount),
                transaction_date: new Date(values.date).toISOString(),
                type: values.type,
                wallet_id: values.walletId,
                category_id: values.type === 'TRANSFER' ? null : (values.categoryId || null),
                destination_wallet_id: values.type === 'TRANSFER' ? values.destinationWalletId : null,
            }

            try {
                // 1. Create Transaction (Backend handles wallet balance adjustments safely)
                await dispatch(createTransaction(newTransaction)).unwrap();

            // 3. Spending Alert Logic for Expenses (Competitor Enhancement)
            if (values.type === 'EXPENSE') {
                const currentMonth = new Date(values.date).getMonth();
                const currentYear = new Date(values.date).getFullYear();

                const monthlyExpenses = transactions.filter(t =>
                    t.type === 'EXPENSE' &&
                    t.wallet_id === values.walletId &&
                    new Date(t.date).getMonth() === currentMonth &&
                    new Date(t.date).getFullYear() === currentYear
                ).reduce((acc, t) => acc + t.amount, 0);

                const newTotalExpense = monthlyExpenses + parseFloat(values.amount);
                const wallet = wallets.find(w => w.id === values.walletId);
                const budgetLimit = wallet ? wallet.balance + newTotalExpense : 5000000; // Simplified Budget estimation (Balance + Total Expenses)

                if (newTotalExpense > budgetLimit * 0.8) {
                    dispatch(addNotification({
                        type: 'BUDGET_ALERT',
                        title: t('notifications.budgetAlertTitle', 'Cảnh báo Chi tiêu'),
                        message: t('notifications.budgetAlertDesc', `Bạn đã chi tiêu ${formatCurrency(newTotalExpense)} (vượt quá 80% định mức) cho ví này trong tháng.`),
                        isRead: false,
                        is_read: false
                    }));
                }
            }

                if (onSuccess) onSuccess();
            } catch (err) {
                console.error("Lỗi tạo giao dịch:", err);
            }
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
                        inputMode="decimal"
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
                                {contextWallets.map(w => (
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
                                {contextWallets.filter(w => w.id !== formik.values.walletId).map(w => (
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
                            {contextWallets.length === 0 && (
                                <option value="" disabled>{t('transactionForm.noWalletsAvailable')}</option>
                            )}
                            {contextWallets.map(w => (
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
                            <option value="">{t('transactionForm.categories.general', 'Chung (không phân loại)')}</option>
                            {categories
                                .filter(cat =>
                                    formik.values.type === 'INCOME'
                                        ? cat.type === 'INCOME'
                                        : cat.type === 'EXPENSE'
                                )
                                .map(cat => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))
                            }
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
