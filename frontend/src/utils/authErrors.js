const ERROR_MAP = {
    INVALID_CREDENTIALS: 'auth.errors.invalidCredentials',
    ACCOUNT_LOCKED: 'auth.errors.accountLocked',
    LOGIN_FAILED: 'auth.loginFailed',
    FILL_ALL_FIELDS: 'auth.errors.fillAllFields',
    PASSWORD_TOO_SHORT: 'auth.passwordMin',
    INVALID_EMAIL: 'auth.emailInvalid',
    EMAIL_IN_USE: 'auth.errors.emailInUse',
    REGISTER_FAILED: 'auth.registerFailed',
    SESSION_EXPIRED: 'auth.errors.sessionExpired',
    REFRESH_TOKEN_MISSING: 'auth.errors.sessionExpired',
    REFRESH_TOKEN_INVALID: 'auth.errors.sessionExpired',
    AUTH_TOKEN_MISSING: 'auth.errors.sessionExpired',
    AUTH_TOKEN_INVALID: 'auth.errors.sessionExpired',
    USER_NOT_FOUND: 'auth.errors.userNotFound',
    TOKEN_INVALID_OR_EXPIRED: 'auth.resetPasswordFailed',
    EMAIL_SEND_FAILED: 'auth.forgotPasswordFailed',
    RESET_PASSWORD_FAILED: 'auth.resetPasswordFailed',
    JWT_SECRET_MISSING: 'common.error',

    PROFILE_LOAD_FAILED: 'errors.profileLoadFailed',
    PROFILE_UPDATE_FAILED: 'errors.profileUpdateFailed',
    PASSWORD_CHANGE_FAILED: 'errors.passwordChangeFailed',
    CURRENT_PASSWORD_INCORRECT: 'errors.currentPasswordIncorrect',
    ACCOUNT_DELETE_FAILED: 'errors.accountDeleteFailed',
    UPLOAD_FAILED: 'errors.uploadFailed',
    UPLOAD_FILE_REQUIRED: 'errors.uploadFileRequired',

    WALLET_LOAD_FAILED: 'errors.wallets.loadFailed',
    WALLET_CREATE_FAILED: 'errors.wallets.createFailed',
    WALLET_UPDATE_FAILED: 'errors.wallets.updateFailed',
    WALLET_DELETE_FAILED: 'errors.wallets.deleteFailed',
    WALLET_NOT_FOUND: 'errors.wallets.notFound',
    WALLET_NAME_EXISTS: 'errors.wallets.nameExists',
    WALLET_HAS_TRANSACTIONS: 'errors.wallets.hasTransactions',
    WALLET_FAMILY_FORBIDDEN: 'errors.wallets.familyForbidden',
    WALLET_REQUIRED: 'errors.wallets.required',
    WALLET_PERSONAL_ONLY: 'errors.wallets.personalOnly',
    WALLET_ID_REQUIRED: 'errors.wallets.idRequired',

    TRANSACTION_NOT_FOUND: 'errors.transactions.notFound',
    TRANSACTION_LOAD_FAILED: 'errors.transactions.loadFailed',
    TRANSACTIONS_LOAD_FAILED: 'errors.transactions.loadFailed',
    TRANSACTION_CREATE_FAILED: 'errors.transactions.createFailed',
    TRANSACTION_DELETE_FAILED: 'errors.transactions.deleteFailed',
    TRANSFER_INCOMPLETE_PAIR: 'errors.transactions.incompletePair',
    TRANSFER_SAME_WALLET: 'errors.transactions.sameWallet',
    TRANSFER_FAILED: 'errors.transactions.transferFailed',
    INVALID_AMOUNT: 'errors.transactions.invalidAmount',
    INSUFFICIENT_BALANCE: 'errors.transactions.insufficientBalance',
    INVALID_TRANSACTION_LIST: 'errors.transactions.invalidList',
    IMPORT_FAILED: 'errors.transactions.importFailed',
    EXPORT_FORMAT_UNSUPPORTED: 'errors.transactions.exportUnsupported',
    EXPORT_FAILED: 'errors.transactions.exportFailed',
    SETTLEMENT_AMOUNT_EXCEEDS_DEBT: 'errors.transactions.settlementAmountExceedsDebt',
    SETTLE_DEBT_FAILED: 'errors.transactions.transferFailed',

    GOAL_LOAD_FAILED: 'errors.goals.loadFailed',
    GOAL_CREATE_FAILED: 'errors.goals.createFailed',
    GOAL_UPDATE_FAILED: 'errors.goals.updateFailed',
    GOAL_DELETE_FAILED: 'errors.goals.deleteFailed',
    GOAL_NOT_FOUND: 'errors.goals.notFound',
    GOAL_DEPOSIT_FAILED: 'errors.goals.depositFailed',

    BUDGET_LOAD_FAILED: 'errors.budgets.loadFailed',
    BUDGET_CREATE_FAILED: 'errors.budgets.createFailed',
    BUDGET_UPDATE_FAILED: 'errors.budgets.updateFailed',
    BUDGET_DELETE_FAILED: 'errors.budgets.deleteFailed',
    BUDGET_NOT_FOUND: 'errors.budgets.notFound',

    FAMILY_FORBIDDEN: 'errors.families.forbidden',
    FAMILY_LOAD_FAILED: 'errors.families.loadFailed',
    FAMILY_CREATE_FAILED: 'errors.families.createFailed',
    FAMILY_DETAIL_FAILED: 'errors.families.detailFailed',
    FAMILY_INVITE_FAILED: 'errors.families.inviteFailed',
    FAMILY_REMOVE_FAILED: 'errors.families.removeFailed',
    FAMILY_DELETE_FAILED: 'errors.families.deleteFailed',
    FAMILY_NOT_FOUND: 'errors.families.notFound',
    FAMILY_ADMIN_REQUIRED: 'errors.families.adminRequired',
    FAMILY_MEMBER_ALREADY_EXISTS: 'errors.families.memberExists',
    FAMILY_OWNER_CANNOT_BE_REMOVED: 'errors.families.ownerCannotBeRemoved',
    FAMILY_OWNER_REQUIRED: 'errors.families.ownerRequired',
    FORBIDDEN_FAMILY_SETTLEMENT: 'errors.families.forbidden',
    INVALID_SETTLEMENT_USERS: 'errors.transactions.transferFailed',
    NO_PAYABLE_DEBT_FOUND: 'family.toasts.optimizationZero',

    RECURRING_LOAD_FAILED: 'errors.recurring.loadFailed',
    RECURRING_CREATE_FAILED: 'errors.recurring.createFailed',
    RECURRING_UPDATE_FAILED: 'errors.recurring.updateFailed',
    RECURRING_DELETE_FAILED: 'errors.recurring.deleteFailed',
    RECURRING_NOT_FOUND: 'errors.recurring.notFound',
    RECURRING_TRIGGER_FAILED: 'errors.recurring.triggerFailed',

    NOTIFICATION_LOAD_FAILED: 'errors.notifications.loadFailed',
    NOTIFICATION_UPDATE_FAILED: 'errors.notifications.updateFailed',
    NOTIFICATION_NOT_FOUND: 'errors.notifications.notFound',
    NOTIFICATION_BROADCAST_FAILED: 'errors.notifications.broadcastFailed',

    CATEGORY_LOAD_FAILED: 'errors.categories.loadFailed',
    CATEGORY_CREATE_FAILED: 'errors.categories.createFailed',
    CATEGORY_UPDATE_FAILED: 'errors.categories.updateFailed',
    CATEGORY_DELETE_FAILED: 'errors.categories.deleteFailed',
    CATEGORY_NOT_FOUND: 'errors.categories.notFound',

    ANALYTICS_OVERVIEW_FAILED: 'errors.analytics.overviewFailed',
    ANALYTICS_REPORT_FAILED: 'errors.analytics.reportFailed',

    ADMIN_DASHBOARD_FAILED: 'errors.admin.dashboardFailed',
    ADMIN_ANALYTICS_FAILED: 'errors.admin.analyticsFailed',
    ADMIN_USERS_FAILED: 'errors.admin.usersFailed',
    ADMIN_USER_DETAIL_FAILED: 'errors.admin.userDetailFailed',
    USER_DELETE_FAILED: 'errors.admin.deleteFailed',
    TOGGLE_LOCK_FAILED: 'errors.admin.toggleLockFailed',
    ROLE_CHANGE_FAILED: 'errors.admin.roleChangeFailed',
    ADMIN_LOGS_FAILED: 'errors.admin.logsFailed',
    ADMIN_FINANCIAL_FAILED: 'errors.admin.financialFailed',
    INVALID_ROLE: 'errors.admin.invalidRole',
    CANNOT_DELETE_SELF: 'errors.admin.cannotDeleteSelf',
    CANNOT_LOCK_SELF: 'errors.admin.cannotLockSelf',
    CANNOT_CHANGE_OWN_ROLE: 'errors.admin.cannotChangeOwnRole',

    FORBIDDEN: 'errors.forbidden',
    UNAUTHORIZED: 'auth.errors.sessionExpired',
    RESOURCE_NOT_FOUND: 'common.error',
    INTERNAL_SERVER_ERROR: 'common.error',
};

const codeToTranslationSuffix = (code, prefix) => {
    return code
        .replace(new RegExp(`^${prefix}_`), '')
        .toLowerCase();
};

export function extractErrorCode(error, fallbackCode = null) {
    if (!error) {
        return fallbackCode;
    }

    if (typeof error === 'string') {
        return error;
    }

    return error.response?.data?.message || error.message || fallbackCode;
}

export function resolveError(errorCode, t, fallbackKey = 'common.error') {
    if (!errorCode) {
        return t(fallbackKey);
    }

    const mappedKey = ERROR_MAP[errorCode];
    if (mappedKey) {
        return t(mappedKey);
    }

    if (errorCode === 'VALIDATION_FAILED') {
        return t('errors.validation.failed', { defaultValue: t(fallbackKey) });
    }

    if (errorCode.startsWith('VALIDATION_')) {
        const validationKey = ['errors', 'validation', codeToTranslationSuffix(errorCode, 'VALIDATION')].join('.');
        return t(validationKey, {
            defaultValue: t(fallbackKey),
        });
    }

    if (errorCode.startsWith('IMPORT_')) {
        const importKey = ['errors', 'import', codeToTranslationSuffix(errorCode, 'IMPORT')].join('.');
        return t(importKey, {
            defaultValue: t(fallbackKey),
        });
    }

    return t(fallbackKey);
}
