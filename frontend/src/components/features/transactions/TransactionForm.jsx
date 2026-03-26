import { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createTransaction, createTransfer } from '@/features/transactions/transactionSlice';
import { fetchCategories } from '@/features/categories/categorySlice';
import { getFinanceScopeLabels } from '@/features/finance/context';
import { refreshFinanceData } from '@/features/finance/refreshFinanceData';
import { formatCurrency } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const EMPTY_ARRAY = [];

const createYupSchema = (t) =>
    Yup.object({
        description: Yup.string().required(t('transactionForm.validations.reqDesc')),
        amount: Yup.number().positive(t('transactionForm.validations.posAmount')).required(t('transactionForm.validations.reqAmount')),
        date: Yup.date().required(t('transactionForm.validations.reqDate')),
        type: Yup.string().oneOf(['EXPENSE', 'INCOME', 'TRANSFER']).required(t('transactionForm.validations.reqType')),
        walletId: Yup.string().required(t('transactionForm.validations.reqWallet')),
        categoryId: Yup.string().notRequired(),
        destinationWalletId: Yup.string().when('type', {
            is: 'TRANSFER',
            then: (schema) =>
                schema
                    .required(t('transactionForm.validations.reqDestWallet'))
                    .notOneOf([Yup.ref('walletId')], t('transactionForm.validations.diffWallet')),
            otherwise: (schema) => schema.notRequired(),
        }),
    });

export function TransactionForm({ onSuccess }) {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const wallets = useSelector((state) => state.wallets?.wallets ?? []);
    const { activeFamilyId, families } = useSelector((state) => state.families ?? {});
    const categories = useSelector((state) => state.categories?.categories ?? EMPTY_ARRAY);
    const [submitError, setSubmitError] = useState('');

    useEffect(() => {
        dispatch(fetchCategories());
    }, [dispatch]);

    const contextWallets = wallets.filter((wallet) => (activeFamilyId ? wallet.family_id === activeFamilyId : !wallet.family_id));
    const financeScope = getFinanceScopeLabels(t, {
        activeFamilyId: activeFamilyId ?? null,
        families: families ?? [],
    });
    const defaultWalletId = contextWallets[0]?.id || '';
    const defaultDestWalletId = contextWallets.find((wallet) => wallet.id !== defaultWalletId)?.id || '';

    const formik = useFormik({
        enableReinitialize: true,
        initialValues: {
            description: '',
            amount: '',
            date: new Date().toISOString().split('T')[0],
            type: 'EXPENSE',
            walletId: defaultWalletId,
            destinationWalletId: defaultDestWalletId,
            categoryId: '',
        },
        validationSchema: createYupSchema(t),
        onSubmit: async (values) => {
            setSubmitError('');

            try {
                if (values.type === 'TRANSFER') {
                    await dispatch(
                        createTransfer({
                            from_wallet_id: values.walletId,
                            to_wallet_id: values.destinationWalletId,
                            amount: parseFloat(values.amount),
                            description: values.description,
                            date: values.date,
                        })
                    ).unwrap();
                } else {
                    await dispatch(
                        createTransaction({
                            description: values.description,
                            amount: parseFloat(values.amount),
                            date: values.date,
                            type: values.type,
                            wallet_id: values.walletId,
                            category_id: values.categoryId || null,
                        })
                    ).unwrap();
                }

                await dispatch(refreshFinanceData());
                if (onSuccess) onSuccess();
            } catch (error) {
                setSubmitError(String(error || t('transactionForm.submitError')));
            }
        },
    });

    const handleTabChange = (value) => {
        formik.setFieldValue('type', value);
    };

    return (
        <form onSubmit={formik.handleSubmit} className="space-y-4" data-testid={`form-${formik.values.type}`}>
            <Tabs defaultValue="EXPENSE" onValueChange={handleTabChange} className="w-full">
                <TabsList className="mb-4 grid w-full grid-cols-3">
                    <TabsTrigger value="EXPENSE">{t('transactionForm.tabs.expense')}</TabsTrigger>
                    <TabsTrigger value="INCOME">{t('transactionForm.tabs.income')}</TabsTrigger>
                    <TabsTrigger value="TRANSFER">{t('transactionForm.tabs.transfer')}</TabsTrigger>
                </TabsList>
            </Tabs>

            <div className="rounded-md border bg-muted/30 px-3 py-2" data-testid="transaction-scope">
                <p className="text-xs font-medium text-muted-foreground">{t('transactions.context.scopeLabel')}</p>
                <p className="text-sm font-medium">{financeScope.scopeTargetLabel}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                    {financeScope.scope === 'family'
                        ? t('transactions.context.familyHint', { target: financeScope.scopeTargetLabel })
                        : t('transactions.context.personalHint')}
                </p>
            </div>

            <div className="space-y-4">
                <div>
                    <label htmlFor="transaction-amount" className="mb-1 block text-sm font-medium">
                        {t('transactionForm.amount')}
                    </label>
                    <Input
                        id="transaction-amount"
                        name="amount"
                        type="number"
                        inputMode="decimal"
                        placeholder="0"
                        value={formik.values.amount}
                        onChange={formik.handleChange}
                        className={formik.errors.amount && formik.touched.amount ? 'border-red-500' : ''}
                    />
                    {formik.errors.amount && formik.touched.amount && <p className="mt-1 text-xs text-red-500">{formik.errors.amount}</p>}
                </div>

                {formik.values.type === 'TRANSFER' ? (
                    <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-2">
                        <div>
                            <label htmlFor="transaction-wallet" className="mb-1 block text-sm font-medium">
                                {t('transactionForm.fromWallet')}
                            </label>
                            <select
                                id="transaction-wallet"
                                name="walletId"
                                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                                value={formik.values.walletId}
                                onChange={formik.handleChange}
                                data-testid="source-wallet-select"
                            >
                                {contextWallets.map((wallet) => (
                                    <option key={wallet.id} value={wallet.id}>
                                        {wallet.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="pt-6 text-muted-foreground">
                            <ArrowRight className="h-4 w-4" />
                        </div>
                        <div>
                            <label htmlFor="transaction-destination-wallet" className="mb-1 block text-sm font-medium">
                                {t('transactionForm.toWallet')}
                            </label>
                            <select
                                id="transaction-destination-wallet"
                                name="destinationWalletId"
                                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                                value={formik.values.destinationWalletId}
                                onChange={formik.handleChange}
                                data-testid="dest-wallet-select"
                            >
                                <option value="" disabled>
                                    {t('transactionForm.selectWallet')}
                                </option>
                                {contextWallets
                                    .filter((wallet) => wallet.id !== formik.values.walletId)
                                    .map((wallet) => (
                                        <option key={wallet.id} value={wallet.id}>
                                            {wallet.name}
                                        </option>
                                    ))}
                            </select>
                            {formik.errors.destinationWalletId && formik.touched.destinationWalletId && (
                                <p className="mt-1 text-xs text-red-500">{formik.errors.destinationWalletId}</p>
                            )}
                        </div>
                    </div>
                ) : (
                    <div>
                        <label htmlFor="transaction-wallet" className="mb-1 block text-sm font-medium">
                            {t('transactionForm.wallet')}
                        </label>
                        <select
                            id="transaction-wallet"
                            name="walletId"
                            className="block h-10 w-full rounded-md border bg-background px-3 text-sm"
                            value={formik.values.walletId}
                            onChange={formik.handleChange}
                            data-testid="source-wallet-select"
                        >
                            {contextWallets.length === 0 && (
                                <option value="" disabled>
                                    {t('transactionForm.noWalletsAvailable')}
                                </option>
                            )}
                            {contextWallets.map((wallet) => (
                                <option key={wallet.id} value={wallet.id}>
                                    {wallet.name} ({formatCurrency(wallet.balance)})
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                <p className="text-xs text-muted-foreground">{t('transactions.context.walletHint')}</p>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                        <label htmlFor="transaction-description" className="mb-1 block text-sm font-medium">
                            {t('transactionForm.description')}
                        </label>
                        <Input
                            id="transaction-description"
                            name="description"
                            placeholder={
                                formik.values.type === 'TRANSFER'
                                    ? t('transactionForm.descPlaceholderTransfer')
                                    : t('transactionForm.descPlaceholderDefault')
                            }
                            value={formik.values.description}
                            onChange={formik.handleChange}
                            className={formik.errors.description && formik.touched.description ? 'border-red-500' : ''}
                        />
                        {formik.errors.description && formik.touched.description && (
                            <p className="mt-1 text-xs text-red-500">{formik.errors.description}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="transaction-date" className="mb-1 block text-sm font-medium">
                            {t('transactionForm.date')}
                        </label>
                        <Input id="transaction-date" name="date" type="date" value={formik.values.date} onChange={formik.handleChange} />
                    </div>
                </div>

                {formik.values.type !== 'TRANSFER' && (
                    <div>
                        <label htmlFor="transaction-category" className="mb-1 block text-sm font-medium">
                            {t('transactionForm.category')}
                        </label>
                        <select
                            id="transaction-category"
                            name="categoryId"
                            className="block h-10 w-full rounded-md border bg-background px-3 text-sm"
                            value={formik.values.categoryId}
                            onChange={formik.handleChange}
                        >
                            <option value="">{t('transactionForm.categories.general')}</option>
                            {categories
                                .filter((category) => (formik.values.type === 'INCOME' ? category.type === 'INCOME' : category.type === 'EXPENSE'))
                                .map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                        </select>
                    </div>
                )}
            </div>

            {submitError && <p className="text-sm text-red-500">{submitError}</p>}

            <div className="flex justify-end gap-2 pt-4">
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                    {formik.values.type === 'TRANSFER' ? t('transactionForm.submitTransfer') : t('transactionForm.submitAdd')}
                </Button>
            </div>
        </form>
    );
}
