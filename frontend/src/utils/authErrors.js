/**
 * Centralized error code to i18n key mapping for the entire application.
 * Backend returns error codes, this utility resolves them to localized messages.
 */

const ERROR_MAP = {
    // ── Auth ──
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
    USER_NOT_FOUND: 'auth.errors.userNotFound',
    TOKEN_INVALID_OR_EXPIRED: 'auth.resetPasswordFailed',
    EMAIL_SEND_FAILED: 'auth.forgotPasswordFailed',
    RESET_PASSWORD_FAILED: 'auth.resetPasswordFailed',
    UPLOAD_FAILED: 'errors.uploadFailed',
    PROFILE_UPDATE_FAILED: 'errors.profileUpdateFailed',

    // ── Wallets ──
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

    // ── Transactions ──
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

    // ── Goals ──
    GOAL_LOAD_FAILED: 'errors.goals.loadFailed',
    GOAL_CREATE_FAILED: 'errors.goals.createFailed',
    GOAL_UPDATE_FAILED: 'errors.goals.updateFailed',
    GOAL_DELETE_FAILED: 'errors.goals.deleteFailed',
    GOAL_NOT_FOUND: 'errors.goals.notFound',
    GOAL_DEPOSIT_FAILED: 'errors.goals.depositFailed',

    // ── Budgets ──
    BUDGET_LOAD_FAILED: 'errors.budgets.loadFailed',
    BUDGET_CREATE_FAILED: 'errors.budgets.createFailed',
    BUDGET_UPDATE_FAILED: 'errors.budgets.updateFailed',
    BUDGET_DELETE_FAILED: 'errors.budgets.deleteFailed',
    BUDGET_NOT_FOUND: 'errors.budgets.notFound',

    // ── Families ──
    FAMILY_FORBIDDEN: 'errors.families.forbidden',
    FAMILY_LOAD_FAILED: 'errors.families.loadFailed',
    FAMILY_CREATE_FAILED: 'errors.families.createFailed',
    FAMILY_DETAIL_FAILED: 'errors.families.detailFailed',
    FAMILY_INVITE_FAILED: 'errors.families.inviteFailed',
    FAMILY_REMOVE_FAILED: 'errors.families.removeFailed',
    FAMILY_NOT_FOUND: 'errors.families.detailFailed',
    FORBIDDEN_FAMILY_SETTLEMENT: 'errors.families.forbidden',
    INVALID_SETTLEMENT_USERS: 'errors.transactions.transferFailed',
    NO_PAYABLE_DEBT_FOUND: 'family.toasts.optimizationZero',
    SETTLEMENT_AMOUNT_EXCEEDS_DEBT: 'errors.transactions.settlementAmountExceedsDebt',
    SETTLE_DEBT_FAILED: 'errors.transactions.transferFailed',

    // ── Recurring ──
    RECURRING_LOAD_FAILED: 'errors.recurring.loadFailed',
    RECURRING_CREATE_FAILED: 'errors.recurring.createFailed',
    RECURRING_UPDATE_FAILED: 'errors.recurring.updateFailed',
    RECURRING_DELETE_FAILED: 'errors.recurring.deleteFailed',

    // ── Notifications ──
    NOTIFICATION_LOAD_FAILED: 'errors.notifications.loadFailed',
    NOTIFICATION_UPDATE_FAILED: 'errors.notifications.updateFailed',

    // ── Categories ──
    CATEGORY_LOAD_FAILED: 'errors.categories.loadFailed',

    // ── Analytics ──
    ANALYTICS_OVERVIEW_FAILED: 'errors.analytics.overviewFailed',
    ANALYTICS_REPORT_FAILED: 'errors.analytics.reportFailed',

    // ── Admin ──
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
};

/**
 * Resolves a backend error code to a localized message using i18n.
 * @param {string} errorCode - The error code from the backend
 * @param {Function} t - The i18n translation function
 * @param {string} [fallbackKey] - Optional fallback i18n key
 * @returns {string} Localized error message
 */
export function resolveError(errorCode, t, fallbackKey = 'common.error') {
    if (!errorCode) return t(fallbackKey);

    const i18nKey = ERROR_MAP[errorCode];
    if (i18nKey) return t(i18nKey);

    // If it looks like a human-readable message (no underscores), pass through
    if (typeof errorCode === 'string' && !errorCode.includes('_')) {
        return errorCode;
    }

    return t(fallbackKey);
}

// Keep backward compatibility alias
export const resolveAuthError = resolveError;
