import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createRecurring } from '@/features/recurring/recurringSlice';
import { formatCurrency } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

const EMPTY_ARRAY = [];

export function RecurringRuleForm({ onSuccess }) {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const wallets = useSelector((state) => state.wallets?.wallets ?? EMPTY_ARRAY);
    const activeFamilyId = useSelector((state) => state.families?.activeFamilyId ?? null);

    const validationSchema = Yup.object().shape({
        name: Yup.string().required(t('transactions.recurring.form.validation.nameRequired')),
        amount: Yup.number()
            .positive(t('transactions.recurring.form.validation.amountPositive'))
            .required(t('transactions.recurring.form.validation.amountRequired')),
        frequency: Yup.string()
            .oneOf(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'])
            .required(t('transactions.recurring.form.validation.frequencyRequired')),
        type: Yup.string().oneOf(['EXPENSE', 'INCOME']).required(t('transactions.recurring.form.validation.typeRequired')),
        walletId: Yup.string().required(t('transactions.recurring.form.validation.walletRequired', 'Vui long chon vi')),
        startDate: Yup.date().required(t('transactions.recurring.form.validation.startDateRequired', 'Vui long chon ngay bat dau')),
    });

    const contextWallets = wallets.filter((wallet) => (activeFamilyId ? wallet.family_id === activeFamilyId : !wallet.family_id));
    const defaultWalletId = contextWallets[0]?.id || '';

    const formik = useFormik({
        enableReinitialize: true,
        initialValues: {
            name: '',
            amount: '',
            frequency: 'MONTHLY',
            type: 'EXPENSE',
            walletId: defaultWalletId,
            categoryId: '',
            startDate: new Date().toISOString().split('T')[0],
        },
        validationSchema,
        onSubmit: async (values) => {
            const payload = {
                description: values.name,
                amount: parseFloat(values.amount),
                type: values.type,
                wallet_id: values.walletId,
                category_id: values.categoryId || null,
                frequency: values.frequency,
                next_run_date: values.startDate,
            };

            try {
                await dispatch(createRecurring(payload)).unwrap();
                if (onSuccess) onSuccess();
            } catch (error) {
                console.error('Loi tao recurring rule:', error);
            }
        },
    });

    return (
        <form onSubmit={formik.handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="recurring-name" className="mb-1 block text-sm font-medium">
                    {t('transactions.recurring.form.name')}
                </label>
                <Input
                    id="recurring-name"
                    name="name"
                    placeholder={t('transactions.recurring.form.namePlaceholder')}
                    value={formik.values.name}
                    onChange={formik.handleChange}
                    className={formik.errors.name ? 'border-red-500' : ''}
                />
                {formik.errors.name && <p className="mt-1 text-xs text-red-500">{formik.errors.name}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="recurring-amount" className="mb-1 block text-sm font-medium">
                        {t('transactions.recurring.form.amount')}
                    </label>
                    <Input
                        id="recurring-amount"
                        name="amount"
                        type="number"
                        placeholder="0"
                        value={formik.values.amount}
                        onChange={formik.handleChange}
                    />
                </div>
                <div>
                    <label htmlFor="recurring-type" className="mb-1 block text-sm font-medium">
                        {t('transactions.recurring.form.type')}
                    </label>
                    <select
                        id="recurring-type"
                        name="type"
                        className="h-10 w-full rounded-md border bg-background px-3 text-sm"
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
                    <label htmlFor="recurring-frequency" className="mb-1 block text-sm font-medium">
                        {t('transactions.recurring.form.frequency')}
                    </label>
                    <select
                        id="recurring-frequency"
                        name="frequency"
                        className="h-10 w-full rounded-md border bg-background px-3 text-sm"
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
                    <label htmlFor="recurring-start-date" className="mb-1 block text-sm font-medium">
                        {t('transactions.recurring.form.startDate')}
                    </label>
                    <Input
                        id="recurring-start-date"
                        name="startDate"
                        type="date"
                        value={formik.values.startDate}
                        onChange={formik.handleChange}
                    />
                </div>
            </div>

            <div>
                <label htmlFor="recurring-wallet" className="mb-1 block text-sm font-medium">
                    {t('transactions.recurring.form.wallet')}
                </label>
                <select
                    id="recurring-wallet"
                    name="walletId"
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                    value={formik.values.walletId}
                    onChange={formik.handleChange}
                >
                    {contextWallets.length === 0 && (
                        <option value="" disabled>
                            {t('transactions.recurring.form.noWallets', 'Khong co vi nao trong muc nay')}
                        </option>
                    )}
                    {contextWallets.map((wallet) => (
                        <option key={wallet.id} value={wallet.id}>
                            {wallet.name} ({formatCurrency(wallet.balance || 0)})
                        </option>
                    ))}
                </select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
                <Button type="submit" className="w-full">
                    {t('transactions.recurring.form.createBtn')}
                </Button>
            </div>
        </form>
    );
}
