const { Op } = require('sequelize');
const { FamilyMember, Wallet } = require('../models');

const normalizeContext = (context) => {
    if (context === 'personal' || context === 'family') {
        return context;
    }

    return 'all';
};

const getFamilyIdsForUser = async (userId, transaction) => {
    const memberships = await FamilyMember.findAll({
        where: { user_id: userId },
        attributes: ['family_id'],
        transaction
    });

    return memberships.map((membership) => membership.family_id);
};

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
