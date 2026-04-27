import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
    Banknote,
    Car,
    Circle,
    CircleDollarSign,
    Coffee,
    Cookie,
    Edit2,
    Film,
    Gamepad2,
    GraduationCap,
    HeartPulse,
    Home as HomeIcon,
    Landmark,
    MoreVertical,
    PiggyBank,
    Plane,
    Receipt,
    ShieldCheck,
    ShoppingBag,
    ShoppingCart,
    Smile,
    Smartphone,
    Tag,
    Trash2,
    Utensils,
    UtensilsCrossed,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Modal } from '@/components/ui/modal';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BudgetForm } from '@/components/features/budgets/BudgetForm';
import { localizeCategoryName } from '@/features/categories/categoryLocalization';
import { fetchCategories } from '@/features/categories/categorySlice';
import { deleteBudget, fetchBudgets } from '@/features/budgets/budgetSlice';
import { getFinanceScopeLabels } from '@/features/finance/context';
import { formatCurrency, formatShortDate } from '@/lib/utils';
import { resolveError } from '@/utils/authErrors';

const categoryIconMap = {
    Banknote,
    Cart: ShoppingCart,
    Car,
    Circle,
    CircleDollarSign,
    Coffee,
    Cookie,
    FastFood: UtensilsCrossed,
    Film,
    Gamepad2,
    GraduationCap,
    HeartPulse,
    Home: HomeIcon,
    Landmark,
    Money: CircleDollarSign,
    PiggyBank,
    Plane,
    Receipt,
    ShieldCheck,
    ShoppingBag,
    ShoppingCart,
    Smile,
    Smartphone,
    Utensils,
    UtensilsCrossed,
};

const getCategoryIcon = (iconName) => categoryIconMap[iconName] || Tag;

export function Budgets() {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const { items, isLoading, deletingId } = useSelector((state) => state.budgets);
    const { categories, isLoading: areCategoriesLoading } = useSelector((state) => state.categories);
    const { activeFamilyId, families } = useSelector((state) => state.families);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingBudget, setEditingBudget] = useState(null);
    const [budgetToDelete, setBudgetToDelete] = useState(null);

    useEffect(() => {
        dispatch(fetchBudgets());
        dispatch(fetchCategories());
    }, [dispatch]);

    const expenseCategories = useMemo(
        () => categories.filter((category) => category?.type === 'EXPENSE'),
        [categories]
    );
    const currentScope = getFinanceScopeLabels(t, { activeFamilyId, families });
    const visibleBudgets = useMemo(
        () =>
            items.filter((budget) =>
                activeFamilyId ? budget.family_id === activeFamilyId : !budget.family_id
            ),
        [activeFamilyId, items]
    );
    const hasExpenseCategories = expenseCategories.length > 0;
    const showCategoryHelper = !areCategoriesLoading && !hasExpenseCategories;
    const pageTitle =
        currentScope.scope === 'family'
            ? t('budgets.context.familyTitle')
            : t('budgets.context.personalTitle');
    const pageDescription =
        currentScope.scope === 'family'
            ? t('budgets.context.familyDesc', { target: currentScope.scopeTargetLabel })
            : t('budgets.context.personalDesc');
    const createTitle =
        currentScope.scope === 'family'
            ? t('budgets.context.addFamilyTitle')
            : t('budgets.context.addPersonalTitle');
    const editScope = editingBudget
        ? getFinanceScopeLabels(t, {
            activeFamilyId,
            families,
            familyId: editingBudget.family_id ?? null,
        })
        : currentScope;
    const editTitle =
        editScope.scope === 'family'
            ? t('budgets.context.editFamilyTitle')
            : t('budgets.context.editPersonalTitle');
    const emptyTitle =
        currentScope.scope === 'family'
            ? t('budgets.context.emptyFamilyTitle')
            : t('budgets.context.emptyPersonalTitle');
    const emptyDescription =
        currentScope.scope === 'family'
            ? t('budgets.context.emptyFamilyDesc', { target: currentScope.scopeTargetLabel })
            : t('budgets.context.emptyPersonalDesc');

    const handleConfirmDelete = async () => {
        if (!budgetToDelete) {
            return;
        }

        try {
            await dispatch(deleteBudget(budgetToDelete.id)).unwrap();
            toast.success(t('budgets.deleteSuccess'));
            setBudgetToDelete(null);
        } catch (error) {
            toast.error(resolveError(error, t, 'budgets.deleteFailed'));
        }
    };

    return (
        <div className="space-y-4 animate-in fade-in duration-500 sm:space-y-6">
            <PageHeader
                title={pageTitle}
                description={pageDescription}
                actions={
                    <Button
                        className="h-11 w-full gap-2 md:w-auto"
                        onClick={() => setIsCreateOpen(true)}
                        disabled={!hasExpenseCategories}
                        data-testid="budgets-create-button"
                    >
                        <PiggyBank className="h-5 w-5" />
                        {t('budgets.createBtn')}
                    </Button>
                }
            />

            {showCategoryHelper ? (
                <div className="rounded-2xl border border-dashed border-amber-300/70 bg-amber-50/80 px-4 py-4 text-sm text-amber-900 dark:border-amber-600/50 dark:bg-amber-950/20 dark:text-amber-100">
                    <p className="font-semibold">{t('budgets.noCategoriesTitle')}</p>
                    <p className="mt-1 text-amber-800/80 dark:text-amber-100/80">
                        {t('budgets.noCategoriesDesc')}
                    </p>
                </div>
            ) : null}

            {isLoading && visibleBudgets.length === 0 ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <Card key={index} className="overflow-hidden">
                            <CardContent className="space-y-4 p-5">
                                <div className="h-5 w-1/2 animate-pulse rounded bg-muted" />
                                <div className="h-8 w-1/3 animate-pulse rounded bg-muted" />
                                <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : visibleBudgets.length === 0 ? (
                <EmptyState
                    icon={PiggyBank}
                    title={emptyTitle}
                    description={emptyDescription}
                    action={
                        hasExpenseCategories ? (
                            <Button className="w-full sm:w-auto" onClick={() => setIsCreateOpen(true)}>
                                {t('budgets.createBtn')}
                            </Button>
                        ) : null
                    }
                />
            ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {visibleBudgets.map((budget) => {
                        const CategoryIcon = getCategoryIcon(budget.Category?.icon);

                        return (
                            <Card key={budget.id} data-testid="budget-card" className="overflow-hidden border-border/60">
                                <CardHeader className="pb-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex min-w-0 items-start gap-3">
                                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                                <CategoryIcon className="h-5 w-5" />
                                            </div>
                                            <div className="min-w-0 space-y-1">
                                                <CardTitle className="truncate text-base sm:text-lg">
                                                    {localizeCategoryName(budget.Category?.name, t) || t('budgets.noCategoryName')}
                                                </CardTitle>
                                                <Badge variant="outline" className="w-fit">
                                                    {budget.family_id ? t('common.family') : t('common.personal')}
                                                </Badge>
                                            </div>
                                        </div>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button
                                                    type="button"
                                                    className="inline-flex h-10 w-10 items-center justify-center rounded-md transition-colors hover:bg-muted"
                                                    data-testid={`budget-actions-${budget.id}`}
                                                >
                                                    <MoreVertical className="h-4 w-4 text-muted-foreground" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => setEditingBudget(budget)}>
                                                    <Edit2 className="mr-2 h-4 w-4" />
                                                    <span>{t('common.edit')}</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-destructive focus:text-destructive"
                                                    onClick={() => setBudgetToDelete(budget)}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    <span>{t('common.delete')}</span>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-4">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">
                                            {t('budgets.limitLabel')}
                                        </p>
                                        <p className="mt-1 text-2xl font-bold">
                                            {formatCurrency(budget.amount_limit)}
                                        </p>
                                    </div>

                                    <div className="rounded-xl bg-muted/40 p-3">
                                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                            {t('budgets.periodLabel')}
                                        </p>
                                        <p className="mt-1 text-sm font-medium">
                                            {formatShortDate(budget.start_date)} - {formatShortDate(budget.end_date)}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            <Modal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                title={createTitle}
                contentTestId="budget-create-modal"
            >
                <BudgetForm
                    categories={expenseCategories}
                    onSuccess={() => setIsCreateOpen(false)}
                />
            </Modal>

            <Modal
                isOpen={Boolean(editingBudget)}
                onClose={() => setEditingBudget(null)}
                title={editTitle}
                contentTestId="budget-edit-modal"
            >
                {editingBudget ? (
                    <BudgetForm
                        key={editingBudget.id}
                        initialData={editingBudget}
                        categories={expenseCategories}
                        onSuccess={() => setEditingBudget(null)}
                    />
                ) : null}
            </Modal>

            <Modal
                isOpen={Boolean(budgetToDelete)}
                onClose={() => setBudgetToDelete(null)}
                title={t('budgets.deleteTitle')}
                contentTestId="budget-delete-modal"
            >
                <div className="space-y-6">
                    <p className="text-sm text-muted-foreground">
                        {budgetToDelete?.family_id
                            ? t('budgets.deleteConfirmFamily', {
                                target: getFinanceScopeLabels(t, {
                                    activeFamilyId,
                                    families,
                                    familyId: budgetToDelete.family_id,
                                }).scopeTargetLabel,
                            })
                            : t('budgets.deleteConfirmPersonal')}
                    </p>

                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <Button type="button" variant="outline" onClick={() => setBudgetToDelete(null)}>
                            {t('common.cancel')}
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleConfirmDelete}
                            disabled={deletingId === budgetToDelete?.id}
                        >
                            {t('common.delete')}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
