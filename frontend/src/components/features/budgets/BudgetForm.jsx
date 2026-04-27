import { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { createBudget, updateBudget } from '@/features/budgets/budgetSlice';
import { localizeCategoryName } from '@/features/categories/categoryLocalization';
import { getFinanceScopeLabels } from '@/features/finance/context';
import { resolveError } from '@/utils/authErrors';

const resolveBudgetSubmitError = (rawError, t) =>
    resolveError(rawError, t, 'budgets.form.validation.saveFailed');

export function BudgetForm({ onSuccess, initialData = null, categories = [] }) {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const { activeFamilyId, families } = useSelector((state) => state.families ?? {});
    const { isSubmitting } = useSelector((state) => state.budgets ?? {});
    const [submitError, setSubmitError] = useState('');
    const isEdit = Boolean(initialData);
    const availableCategories = categories.filter((category) => category?.type === 'EXPENSE');
    const budgetScope = getFinanceScopeLabels(t, {
        activeFamilyId: activeFamilyId ?? null,
        families: families ?? [],
        familyId: initialData?.family_id,
    });
    const submitLabel = isEdit
        ? t('budgets.form.saveBtn')
        : budgetScope.scope === 'family'
            ? t('budgets.form.createFamilyBtn')
            : t('budgets.form.createPersonalBtn');

    const validationSchema = Yup.object().shape({
        category_id: Yup.string().required(t('budgets.form.validation.categoryRequired')),
        amount_limit: Yup.number()
            .typeError(t('budgets.form.validation.amountRequired'))
            .required(t('budgets.form.validation.amountRequired'))
            .moreThan(0, t('budgets.form.validation.amountPositive')),
        start_date: Yup.date()
            .typeError(t('budgets.form.validation.startDateRequired'))
            .required(t('budgets.form.validation.startDateRequired')),
        end_date: Yup.date()
            .typeError(t('budgets.form.validation.endDateRequired'))
            .required(t('budgets.form.validation.endDateRequired'))
            .min(Yup.ref('start_date'), t('budgets.form.validation.endDateAfterStart')),
    });

    const formik = useFormik({
        initialValues: {
            category_id: initialData?.category_id || initialData?.Category?.id || '',
            amount_limit: initialData?.amount_limit ?? '',
            start_date: initialData?.start_date || '',
            end_date: initialData?.end_date || '',
        },
        enableReinitialize: true,
        validationSchema,
        onSubmit: async (values) => {
            setSubmitError('');

            const budgetData = {
                category_id: values.category_id,
                amount_limit: Number(values.amount_limit),
                start_date: values.start_date,
                end_date: values.end_date,
            };

            if (!isEdit && activeFamilyId) {
                budgetData.family_id = activeFamilyId;
            }

            try {
                if (isEdit) {
                    await dispatch(updateBudget({ id: initialData.id, data: budgetData })).unwrap();
                    toast.success(t('budgets.updateSuccess'));
                } else {
                    await dispatch(createBudget(budgetData)).unwrap();
                    toast.success(t('budgets.createSuccess'));
                }

                if (onSuccess) {
                    onSuccess();
                }
            } catch (error) {
                setSubmitError(resolveBudgetSubmitError(error, t));
            }
        },
    });

    const showError = (fieldName) => (formik.touched[fieldName] || formik.submitCount > 0) && formik.errors[fieldName];

    return (
        <form onSubmit={formik.handleSubmit} className="space-y-4">
            <div className="rounded-md border bg-muted/30 px-3 py-2" data-testid="budget-form-scope">
                <p className="text-xs font-medium text-muted-foreground">{t('budgets.form.scopeLabel')}</p>
                <p className="text-sm font-medium">{budgetScope.scopeTargetLabel}</p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="budget-category">{t('budgets.form.category')}</Label>
                <Select
                    value={formik.values.category_id}
                    onValueChange={(value) => {
                        formik.setFieldValue('category_id', value);
                        formik.setFieldTouched('category_id', true, false);
                    }}
                    disabled={availableCategories.length === 0 || isSubmitting}
                >
                    <SelectTrigger id="budget-category" data-testid="budget-form-category">
                        <SelectValue placeholder={t('budgets.form.categoryPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                        {availableCategories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                                {localizeCategoryName(category.name, t)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {showError('category_id') ? (
                    <p className="text-xs text-red-500">{formik.errors.category_id}</p>
                ) : null}
            </div>

            <div className="space-y-2">
                <Label htmlFor="budget-amount">{t('budgets.form.amount')}</Label>
                <Input
                    id="budget-amount"
                    name="amount_limit"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder={t('budgets.form.amountPlaceholder')}
                    value={formik.values.amount_limit}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    disabled={isSubmitting}
                />
                {showError('amount_limit') ? (
                    <p className="text-xs text-red-500">{formik.errors.amount_limit}</p>
                ) : null}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="budget-start-date">{t('budgets.form.startDate')}</Label>
                    <Input
                        id="budget-start-date"
                        name="start_date"
                        type="date"
                        value={formik.values.start_date}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        disabled={isSubmitting}
                    />
                    {showError('start_date') ? (
                        <p className="text-xs text-red-500">{formik.errors.start_date}</p>
                    ) : null}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="budget-end-date">{t('budgets.form.endDate')}</Label>
                    <Input
                        id="budget-end-date"
                        name="end_date"
                        type="date"
                        value={formik.values.end_date}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        disabled={isSubmitting}
                    />
                    {showError('end_date') ? (
                        <p className="text-xs text-red-500">{formik.errors.end_date}</p>
                    ) : null}
                </div>
            </div>

            {availableCategories.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('budgets.form.noCategories')}</p>
            ) : null}

            {submitError ? <p className="text-sm text-red-500">{submitError}</p> : null}

            <div className="flex justify-end pt-4">
                <Button type="submit" className="w-full" disabled={availableCategories.length === 0 || isSubmitting}>
                    {submitLabel}
                </Button>
            </div>
        </form>
    );
}
