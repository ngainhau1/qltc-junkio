import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createWallet, editWallet } from '@/features/wallets/walletSlice';
import { useTranslation } from 'react-i18next';

const resolveWalletSubmitError = (rawError, t) => {
    const message = String(rawError || '').trim();
    const normalized = message.toLowerCase();

    if (normalized.includes('ten vi da ton tai') || normalized.includes('tên ví đã tồn tại')) {
        return t('wallets.form.validation.duplicateName');
    }

    return t('wallets.form.validation.saveFailed');
};

export function WalletForm({ onSuccess, initialData = null }) {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const activeFamilyId = useSelector((state) => state.families?.activeFamilyId ?? null);
    const isEdit = !!initialData;
    const [submitError, setSubmitError] = useState('');

    const validationSchema = Yup.object().shape({
        name: Yup.string().required(t('wallets.form.validation.nameRequired')),
        balance: Yup.number().min(0, t('wallets.form.validation.balanceMin')).required(t('wallets.form.validation.balanceRequired')),
        type: Yup.string().oneOf(['cash', 'bank', 'credit-card', 'e-wallet']).required(t('wallets.form.validation.typeRequired')),
    });

    const formik = useFormik({
        initialValues: {
            name: initialData?.name || '',
            balance: initialData?.balance || '',
            type: initialData?.type || 'cash',
        },
        validationSchema,
        onSubmit: async (values) => {
            setSubmitError('');
            const walletData = {
                name: values.name,
                balance: parseFloat(values.balance),
                currency: initialData?.currency || 'VND',
                type: values.type,
                family_id: initialData?.family_id ?? activeFamilyId ?? null,
            };

            try {
                if (isEdit) {
                    await dispatch(editWallet({ id: initialData.id, data: walletData })).unwrap();
                } else {
                    await dispatch(createWallet(walletData)).unwrap();
                }
                if (onSuccess) onSuccess();
            } catch (err) {
                setSubmitError(resolveWalletSubmitError(err, t));
            }
        },
    });

    return (
        <form onSubmit={formik.handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="wallet-name" className="text-sm font-medium mb-1 block">{t('wallets.form.name')}</label>
                <Input
                    id="wallet-name"
                    name="name"
                    placeholder={t('wallets.form.namePlaceholder')}
                    value={formik.values.name}
                    onChange={formik.handleChange}
                    className={formik.errors.name ? 'border-red-500' : ''}
                />
                {formik.errors.name && <p className="text-xs text-red-500 mt-1">{formik.errors.name}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="wallet-balance" className="text-sm font-medium mb-1 block">{t('wallets.form.balance')}</label>
                    <Input
                        id="wallet-balance"
                        name="balance"
                        type="number"
                        placeholder="0"
                        value={formik.values.balance}
                        onChange={formik.handleChange}
                    />
                </div>
                <div>
                    <label htmlFor="wallet-type" className="text-sm font-medium mb-1 block">{t('wallets.form.type')}</label>
                    <select
                        id="wallet-type"
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

            {submitError && <p className="text-sm text-red-500">{submitError}</p>}

            <div className="pt-4 flex justify-end gap-2">
                <Button type="submit" className="w-full">{isEdit ? t('common.save') : t('wallets.form.createBtn')}</Button>
            </div>
        </form>
    );
}
