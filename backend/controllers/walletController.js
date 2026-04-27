const { Wallet, Transaction, FamilyMember } = require('../models');
const { Op, fn, col, where } = require('sequelize');
const { success, error, notFound, serverError, created } = require('../utils/responseHelper');

const getUserFamilyIds = async (userId) => {
    const userFamilies = await FamilyMember.findAll({
        where: { user_id: userId },
        attributes: ['family_id']
    });
    return userFamilies.map((f) => f.family_id);
};

const buildWalletAccessWhere = (id, userId, familyIds) => ({
    ...(id ? { id } : {}),
    [Op.or]: [
        { user_id: userId },
        ...(familyIds.length > 0 ? [{ family_id: { [Op.in]: familyIds } }] : [])
    ]
});

const hasDuplicateWalletName = async ({ name, userId, familyId = null, excludeId = null }) => {
    const normalizedName = String(name || '').trim().toLowerCase();
    if (!normalizedName) return false;

    const whereClause = {
        [Op.and]: [
            where(fn('lower', col('name')), normalizedName),
            familyId ? { family_id: familyId } : { user_id: userId, family_id: null }
        ]
    };

    if (excludeId) {
        whereClause.id = { [Op.ne]: excludeId };
    }

    const existed = await Wallet.findOne({ where: whereClause, attributes: ['id'] });
    return Boolean(existed);
};

exports.getUserWallets = async (req, res) => {
    try {
        const userId = req.user.id;
        const familyIds = await getUserFamilyIds(userId);

        const wallets = await Wallet.findAll({
            where: buildWalletAccessWhere(null, userId, familyIds),
            order: [['createdAt', 'DESC']]
        });

        success(res, wallets, 'WALLETS_LOADED');
    } catch (err) {
        console.error('Error fetching wallets:', err);
        serverError(res, 'WALLET_LOAD_FAILED');
    }
};

exports.createWallet = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, balance, currency, family_id } = req.body;
        const normalizedName = String(name || '').trim();
        const familyIds = await getUserFamilyIds(userId);

        if (family_id && !familyIds.includes(family_id)) {
            return error(res, 'WALLET_FAMILY_FORBIDDEN', 403);
        }

        const duplicated = await hasDuplicateWalletName({
            name: normalizedName,
            userId,
            familyId: family_id || null
        });
        if (duplicated) {
            return error(res, 'WALLET_NAME_EXISTS', 409);
        }

        const newWallet = await Wallet.create({
            name: normalizedName,
            balance: balance || 0,
            currency: currency || 'VND',
            user_id: family_id ? null : userId,
            family_id: family_id || null
        });

        created(res, newWallet, 'WALLET_CREATED');
    } catch (err) {
        console.error('Error creating wallet:', err);
        if (err.name === 'SequelizeUniqueConstraintError') {
            return error(res, 'WALLET_NAME_EXISTS', 409);
        }
        serverError(res, 'WALLET_CREATE_FAILED');
    }
};

exports.updateWallet = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { name, balance, currency } = req.body;

        const familyIds = await getUserFamilyIds(userId);

        const wallet = await Wallet.findOne({
            where: buildWalletAccessWhere(id, userId, familyIds)
        });

        if (!wallet) {
            return notFound(res, 'WALLET_NOT_FOUND');
        }

        const nextName = name !== undefined ? String(name).trim() : wallet.name;
        const duplicated = await hasDuplicateWalletName({
            name: nextName,
            userId,
            familyId: wallet.family_id || null,
            excludeId: wallet.id
        });
        if (duplicated) {
            return error(res, 'WALLET_NAME_EXISTS', 409);
        }

        await wallet.update({
            name: nextName,
            balance: balance !== undefined ? balance : wallet.balance,
            currency: currency !== undefined ? currency : wallet.currency
        });

        success(res, wallet, 'WALLET_UPDATED');
    } catch (err) {
        console.error('Error updating wallet:', err);
        if (err.name === 'SequelizeUniqueConstraintError') {
            return error(res, 'WALLET_NAME_EXISTS', 409);
        }
        serverError(res, 'WALLET_UPDATE_FAILED');
    }
};

exports.deleteWallet = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const familyIds = await getUserFamilyIds(userId);

        const wallet = await Wallet.findOne({
            where: buildWalletAccessWhere(id, userId, familyIds)
        });

        if (!wallet) {
            return notFound(res, 'WALLET_NOT_FOUND');
        }

        const transactionCount = await Transaction.count({ where: { wallet_id: id } });
        if (transactionCount > 0) {
            return error(res, 'WALLET_HAS_TRANSACTIONS', 400);
        }

        await wallet.destroy();

        success(res, null, 'WALLET_DELETED');
    } catch (err) {
        console.error('Error deleting wallet:', err);
        serverError(res, 'WALLET_DELETE_FAILED');
    }
};
