const { Wallet, Transaction } = require('../models');

// GET /api/wallets
// Get all wallets for the logged in user (personal + family wallets)
exports.getUserWallets = async (req, res) => {
    try {
        const userId = req.user.id;

        // Find wallets where user is the owner OR family_id is in the user's family memberships
        // For simplicity right now, we just fetch personal wallets and wallets belonging to families the user is part of.
        // We will need the FamilyMember model to join properly.
        const { FamilyMember } = require('../models');

        const userFamilies = await FamilyMember.findAll({
            where: { user_id: userId },
            attributes: ['family_id']
        });
        const familyIds = userFamilies.map(f => f.family_id);

        const wallets = await Wallet.findAll({
            where: {
                // Sequelize OR condition
                [require('sequelize').Op.or]: [
                    { user_id: userId },
                    { family_id: { [require('sequelize').Op.in]: familyIds } }
                ]
            },
            order: [['createdAt', 'DESC']]
        });

        res.json(wallets);
    } catch (error) {
        console.error('Error fetching wallets:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// POST /api/wallets
// Create a new wallet
exports.createWallet = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, balance, currency, type, family_id } = req.body;

        const newWallet = await Wallet.create({
            name,
            balance: balance || 0,
            currency: currency || 'VND',
            user_id: family_id ? null : userId, // If it's a family wallet, user_id might be null or the creator
            family_id: family_id || null,
            // Assuming 'type' is stored somewhere or mapped to currency/name. The model doesn't have 'type' explicitly, let's just use what's in model.
        });

        res.status(201).json(newWallet);
    } catch (error) {
        console.error('Error creating wallet:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// PUT /api/wallets/:id
// Update a wallet
exports.updateWallet = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { name, balance, currency } = req.body;

        // Security: Check ownership (personal or family wallet)
        const { FamilyMember } = require('../models');
        const { Op } = require('sequelize');
        const userFamilies = await FamilyMember.findAll({
            where: { user_id: userId }, attributes: ['family_id']
        });
        const familyIds = userFamilies.map(f => f.family_id);

        const wallet = await Wallet.findOne({
            where: {
                id,
                [Op.or]: [
                    { user_id: userId },
                    ...(familyIds.length > 0 ? [{ family_id: { [Op.in]: familyIds } }] : [])
                ]
            }
        });

        if (!wallet) {
            return res.status(404).json({ message: 'Ví không tồn tại hoặc bạn không có quyền' });
        }

        await wallet.update({
            name: name !== undefined ? name : wallet.name,
            balance: balance !== undefined ? balance : wallet.balance,
            currency: currency !== undefined ? currency : wallet.currency
        });

        res.json(wallet);
    } catch (error) {
        console.error('Error updating wallet:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// DELETE /api/wallets/:id
// Delete a wallet
exports.deleteWallet = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Security: Check ownership (personal or family wallet)
        const { FamilyMember } = require('../models');
        const { Op } = require('sequelize');
        const userFamilies = await FamilyMember.findAll({
            where: { user_id: userId }, attributes: ['family_id']
        });
        const familyIds = userFamilies.map(f => f.family_id);

        const wallet = await Wallet.findOne({
            where: {
                id,
                [Op.or]: [
                    { user_id: userId },
                    ...(familyIds.length > 0 ? [{ family_id: { [Op.in]: familyIds } }] : [])
                ]
            }
        });

        if (!wallet) {
            return res.status(404).json({ message: 'Ví không tồn tại hoặc bạn không có quyền' });
        }

        // Check for existing transactions
        const transactionCount = await Transaction.count({ where: { wallet_id: id } });
        if (transactionCount > 0) {
            return res.status(400).json({ message: 'Cannot delete wallet with existing transactions' });
        }

        await wallet.destroy();

        res.json({ message: 'Wallet deleted successfully' });
    } catch (error) {
        console.error('Error deleting wallet:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
