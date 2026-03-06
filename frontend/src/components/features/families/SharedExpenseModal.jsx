import { useFormik } from "formik"
import * as Yup from "yup"
import { useDispatch, useSelector } from "react-redux"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { decreaseBalance } from "@/features/wallets/walletSlice"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import { formatCurrency, generateId } from "@/lib/utils"

export function SharedExpenseModal({ isOpen, onClose, family, familyWalletId }) {
    const { t } = useTranslation()
    const dispatch = useDispatch()
    const { user } = useSelector(state => state.auth)

    const validationSchema = Yup.object().shape({
        description: Yup.string().required(t('sharedExpense.errDesc')),
        amount: Yup.number().positive(t('sharedExpense.errAmount')).required(t('sharedExpense.errAmount')),
        paidBy: Yup.string().required()
    })

    const formik = useFormik({
        initialValues: {
            description: "",
            amount: "",
            paidBy: user ? String(user.id) : ""
        },
        validationSchema,
        enableReinitialize: true,
        onSubmit: (values) => {
            if (!familyWalletId) {
                toast.error(t('sharedExpense.errNoWallet'));
                return;
            }

            const totalAmount = parseFloat(values.amount);
            const memberCount = family?.members.length || 1;
            const splitAmount = totalAmount / memberCount;

            const shares = family.members.map(m => ({
                id: generateId('s'),
                user_id: m.id,
                amount: splitAmount,
                status: m.id === values.paidBy ? 'PAID' : 'UNPAID',
                approval_status: m.id === values.paidBy ? 'APPROVED' : 'PENDING'
            }));

            const newTx = {
                id: generateId('t-shared'),
                amount: totalAmount,
                date: new Date().toISOString(),
                transaction_date: new Date().toISOString(),
                description: values.description,
                type: 'EXPENSE',
                wallet_id: familyWalletId,
                category_id: 'general',
                user_id: values.paidBy,
                shares: shares,
                created_at: new Date().toISOString()
            };

            dispatch({ type: 'transactions/addTransaction', payload: newTx });
            dispatch(decreaseBalance({ id: familyWalletId, amount: totalAmount }));

            toast.success(t('sharedExpense.successMsg'));
            formik.resetForm();
            onClose();
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
                        placeholder="0"
                        {...formik.getFieldProps('amount')}
                        className={formik.touched.amount && formik.errors.amount ? "border-red-500" : ""}
                    />
                    {formik.touched.amount && formik.errors.amount && (
                        <p className="text-xs text-red-500">{formik.errors.amount}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label>{t('sharedExpense.paidByLabel')}</Label>
                    <Select
                        value={String(formik.values.paidBy)}
                        onValueChange={(val) => formik.setFieldValue('paidBy', val)}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Chọn thành viên" />
                        </SelectTrigger>
                        <SelectContent>
                            {family?.members.map(m => (
                                <SelectItem key={m.id} value={String(m.id)}>
                                    {m.name} {m.id === user?.id ? "(Bạn)" : ""}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
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

                <div className="pt-2 flex justify-end gap-2 border-t mt-6">
                    <Button type="button" variant="ghost" onClick={onClose}>{t('sharedExpense.cancelBtn')}</Button>
                    <Button type="submit">{t('sharedExpense.submitBtn')}</Button>
                </div>
            </form>
        </Modal>
    )
}
