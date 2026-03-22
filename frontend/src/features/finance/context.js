export const cleanQueryParams = (params) =>
    Object.fromEntries(
        Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')
    );

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
