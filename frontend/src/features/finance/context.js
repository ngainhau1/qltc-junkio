export const cleanQueryParams = (params) =>
    Object.fromEntries(
        Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')
    );

export const resolveFinanceScope = ({ activeFamilyId = null, families = [], familyId } = {}) => {
    const resolvedFamilyId = familyId === undefined ? activeFamilyId ?? null : familyId ?? null;

    if (!resolvedFamilyId) {
        return {
            scope: 'personal',
            familyId: null,
            familyName: null,
        };
    }

    const family = Array.isArray(families) ? families.find((item) => item?.id === resolvedFamilyId) : null;

    return {
        scope: 'family',
        familyId: resolvedFamilyId,
        familyName: family?.name ?? null,
    };
};

export const getFinanceScopeLabels = (t, options = {}) => {
    const scopeInfo = resolveFinanceScope(options);

    return {
        ...scopeInfo,
        scopeLabel: scopeInfo.scope === 'family' ? t('common.family') : t('common.personal'),
        scopeTargetLabel:
            scopeInfo.scope === 'family'
                ? scopeInfo.familyName
                    ? t('common.familyNamed', { name: scopeInfo.familyName })
                    : t('common.family')
                : t('common.personal'),
    };
};

export const getCurrentFinanceContextParams = (state) => {
    const activeFamilyId = state?.families?.activeFamilyId;

    if (activeFamilyId) {
        return {
            context: 'family',
            family_id: activeFamilyId,
        };
    }

    return {
        context: 'personal',
    };
};

export const buildTransactionQueryFromState = (state, overrides = {}) => {
    const filter = state?.transactions?.filter ?? {};
    const pagination = state?.transactions?.pagination ?? {};

    return cleanQueryParams({
        ...getCurrentFinanceContextParams(state),
        page: overrides.page ?? pagination.currentPage ?? 1,
        limit: overrides.limit ?? pagination.itemsPerPage ?? 50,
        search: overrides.search ?? filter.search ?? '',
        type: overrides.type ?? filter.type ?? '',
        startDate: overrides.startDate ?? filter.startDate ?? '',
        endDate: overrides.endDate ?? filter.endDate ?? '',
        wallet_id: overrides.wallet_id ?? overrides.walletId ?? filter.walletId ?? '',
        category_id: overrides.category_id ?? overrides.categoryId ?? filter.categoryId ?? '',
        sortBy: overrides.sortBy ?? filter.sortBy ?? 'date',
        sortOrder: overrides.sortOrder ?? filter.sortOrder ?? 'DESC',
    });
};

export const buildAnalyticsQueryFromState = (state, overrides = {}) =>
    cleanQueryParams({
        ...getCurrentFinanceContextParams(state),
        startDate: overrides.startDate ?? '',
        endDate: overrides.endDate ?? '',
        type: overrides.type ?? '',
        wallet_id: overrides.wallet_id ?? overrides.walletId ?? '',
        category_id: overrides.category_id ?? overrides.categoryId ?? '',
    });
