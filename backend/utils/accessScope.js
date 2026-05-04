const { Op } = require('sequelize');
const { FamilyMember, Wallet } = require('../models');

/**
 * Chuan hoa context do frontend/API truyen vao.
 *
 * - `personal`: chi lay du lieu ca nhan cua user.
 * - `family`: chi lay du lieu family ma user la thanh vien.
 * - `all`: gom ca personal va family. Bat ky gia tri la/khong truyen nao
 *   deu fallback ve `all` de giu hanh vi backward-compatible cho cac API cu.
 */
const normalizeContext = (context) => {
    if (context === 'personal' || context === 'family') {
        return context;
    }

    return 'all';
};

/**
 * Lay danh sach family ma user hien tai la thanh vien.
 *
 * Ham nay chi tra ve id, khong load toan bo Family, vi phan lon use-case chi
 * can danh sach id de build dieu kien `WHERE family_id IN (...)`.
 * `transaction` duoc truyen xuong de cac service co the goi trong cung DB transaction
 * khi can tinh toan va ghi du lieu mot cach nhat quan.
 */
const getFamilyIdsForUser = async (userId, transaction) => {
    const memberships = await FamilyMember.findAll({
        where: { user_id: userId },
        attributes: ['family_id'],
        transaction
    });

    return memberships.map((membership) => membership.family_id);
};

/**
 * Tao dieu kien Sequelize `where` cho bang Wallet theo pham vi truy cap.
 *
 * Day la diem tap trung de tranh lap logic phan quyen vi o controller:
 * - Personal: chi vi co `user_id = userId` va khong thuoc family.
 * - Family: chi vi thuoc cac family user tham gia; neu co `familyId` thi
 *   gioi han vao dung family do.
 * - All: gom vi ca nhan cua user va vi family user co quyen truy cap.
 *
 * Neu user yeu cau mot family khong thuoc ve minh, ham tra ve dieu kien rong
 * `{ id: { [Op.in]: [] } }` de query hop le nhung khong ro ri du lieu.
 */
const buildWalletWhere = ({ userId, context, familyId, familyIds }) => {
    const normalizedContext = normalizeContext(context);

    if (normalizedContext === 'personal') {
        return {
            user_id: userId,
            family_id: null
        };
    }

    if (normalizedContext === 'family') {
        const scopedFamilyIds = familyId
            ? familyIds.filter((id) => id === familyId)
            : familyIds;

        if (scopedFamilyIds.length === 0) {
            return { id: { [Op.in]: [] } };
        }

        return {
            family_id: { [Op.in]: scopedFamilyIds }
        };
    }

    return {
        [Op.or]: [
            { user_id: userId },
            ...(familyIds.length ? [{ family_id: { [Op.in]: familyIds } }] : [])
        ]
    };
};

/**
 * Lay danh sach wallet user duoc phep xem/ghi theo context.
 *
 * Return gom ca `familyIds` va `normalizedContext` de caller co the tai su dung
 * cho cac query lien quan nhu transaction, budget, dashboard ma khong can tra cuu
 * membership lai nhieu lan.
 */
const getAccessibleWallets = async ({ userId, context, familyId, transaction, attributes }) => {
    const familyIds = await getFamilyIdsForUser(userId, transaction);
    const where = buildWalletWhere({ userId, context, familyId, familyIds });

    const wallets = await Wallet.findAll({
        where,
        attributes,
        transaction
    });

    return {
        wallets,
        familyIds,
        normalizedContext: normalizeContext(context)
    };
};

/**
 * Bien the gon cua `getAccessibleWallets` khi caller chi can danh sach wallet id.
 *
 * Thuong dung trong analytics/report/transaction filters de tao dieu kien:
 * `wallet_id IN walletIds`. Ham van tra ve `familyIds` de caller co the ket hop
 * voi cac bang khac co `family_id` truc tiep.
 */
const getAccessibleWalletIds = async ({ userId, context, familyId, transaction }) => {
    const { wallets, familyIds, normalizedContext } = await getAccessibleWallets({
        userId,
        context,
        familyId,
        transaction,
        attributes: ['id']
    });

    return {
        walletIds: wallets.map((wallet) => wallet.id),
        familyIds,
        normalizedContext
    };
};

module.exports = {
    normalizeContext,
    getFamilyIdsForUser,
    buildWalletWhere,
    getAccessibleWallets,
    getAccessibleWalletIds
};
