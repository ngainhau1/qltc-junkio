import { useFormik } from "formik"
import * as Yup from "yup"
import { useDispatch, useSelector } from "react-redux"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createTransaction } from "@/features/transactions/transactionSlice"
import { refreshFinanceData } from "@/features/finance/refreshFinanceData"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import { formatCurrency, generateId } from "@/lib/utils"
import { resolveError } from "@/utils/authErrors"

export function SharedExpenseModal({ isOpen, onClose, family }) {
    const { t } = useTranslation()
    const dispatch = useDispatch()
    const { user } = useSelector(state => state.auth)
    const { wallets } = useSelector(state => state.wallets)
    const personalWallets = wallets.filter((wallet) => wallet.user_id === user?.id && !wallet.family_id)

    const validationSchema = Yup.object().shape({
        description: Yup.string().required(t('sharedExpense.errDesc')),
        amount: Yup.number().positive(t('sharedExpense.errAmount')).required(t('sharedExpense.errAmount')),
        walletId: Yup.string().required(t('sharedExpense.errNoPersonalWallet'))
    })

    const formik = useFormik({
        initialValues: {
            description: "",
            amount: "",
            walletId: personalWallets[0]?.id || ""
        },
        validationSchema,
        enableReinitialize: true,
        onSubmit: async (values) => {
            if (!values.walletId) {
                toast.error(t('sharedExpense.errNoPersonalWallet'));
                return;
            }

            const totalAmount = parseFloat(values.amount);
            const memberCount = family?.members.length || 1;
            const splitAmount = totalAmount / memberCount;

            const shares = family.members.map(m => {
                const isPayer = m.id === user?.id;

                return {
                    id: generateId('s'),
                    user_id: m.id,
                    amount: splitAmount,
                    status: isPayer ? 'PAID' : 'UNPAID',
                    approval_status: 'APPROVED'
                };
            });

            const newTx = {
                amount: totalAmount,
                date: new Date().toISOString(),
                description: values.description,
                type: 'EXPENSE',
                wallet_id: values.walletId,
                category_id: null,
                user_id: user?.id,
                family_id: family.id,
                shares: shares
            };

            try {
                await dispatch(createTransaction(newTx)).unwrap();
                await dispatch(refreshFinanceData());

                toast.success(t('sharedExpense.successMsg'));
                formik.resetForm();
                onClose();
            } catch (error) {
                console.error("Lỗi tạo chi tiêu chung:", error);
                toast.error(resolveError(error, t, 'errors.transactions.createFailed'));
            }
        }
    });

    const currentAmount = parseFloat(formik.values.amount) || 0;
    const splitAmount = currentAmount / (family?.members?.length || 1);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('sharedExpense.title')}>
            <form onSubmit={formik.handleSubmit} className="space-y-4">
                <p className="text-sm text-muted-foreground mb-4">
                    {t('sharedExpense.desc')}
                </p>

                <div className="space-y-2">
                    <Label htmlFor="description">{t('sharedExpense.descriptionLabel')}</Label>
                    <Input
                        id="description"
                        placeholder={t('sharedExpense.descriptionPlaceholder')}
                        {...formik.getFieldProps('description')}
                        className={formik.touched.description && formik.errors.description ? "border-red-500" : ""}
                    />
                    {formik.touched.description && formik.errors.description && (
                        <p className="text-xs text-red-500">{formik.errors.description}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="amount">{t('sharedExpense.amountLabel')}</Label>
                    <Input
                        id="amount"
                        type="number"
                        inputMode="decimal"
                        placeholder="0"
                        {...formik.getFieldProps('amount')}
                        className={formik.touched.amount && formik.errors.amount ? "border-red-500" : ""}
                    />
                    {formik.touched.amount && formik.errors.amount && (
                        <p className="text-xs text-red-500">{formik.errors.amount}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label>{t('sharedExpense.walletLabel')}</Label>
                    <Select
                        value={formik.values.walletId}
                        onValueChange={(value) => formik.setFieldValue('walletId', value)}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder={t('sharedExpense.selectWallet')} />
                        </SelectTrigger>
                        <SelectContent>
                            {personalWallets.map((wallet) => (
                                <SelectItem key={wallet.id} value={wallet.id}>
                                    {wallet.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {formik.touched.walletId && formik.errors.walletId && (
                        <p className="text-xs text-red-500">{formik.errors.walletId}</p>
                    )}
                </div>

                {currentAmount > 0 && (
                    <div className="bg-muted p-3 rounded-lg mt-4">
                        <p className="text-sm font-medium mb-1">{t('sharedExpense.previewLabel')}</p>
                        <p className="text-sm text-muted-foreground">
                            {t('sharedExpense.splitEqually', {
                                count: family?.members.length,
                                amount: formatCurrency(splitAmount)
                            })}
                        </p>
                    </div>
                )}

                <div className="mt-6 flex flex-col-reverse gap-2 border-t pt-2 sm:flex-row sm:justify-end">
                    <Button type="button" variant="ghost" onClick={onClose} className="w-full sm:w-auto">{t('sharedExpense.cancelBtn')}</Button>
                    <Button type="submit" className="w-full sm:w-auto">{t('sharedExpense.submitBtn')}</Button>
                </div>
            </form>
        </Modal>
    )
}
