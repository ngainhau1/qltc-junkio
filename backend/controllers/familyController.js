const { Family, FamilyMember, User, Wallet } = require('../models');
const { Op } = require('sequelize');

// GET /api/families
// Get all families user is part of
exports.getUserFamilies = async (req, res) => {
    try {
        const userId = req.user.id;

        // Find families through FamilyMember
        const members = await FamilyMember.findAll({
            where: { user_id: userId },
            include: [{
                model: Family,
                include: [
                    {
                        model: User,
                        as: 'Owner',
                        attributes: ['id', 'name', 'email']
                    },
                    {
                        model: User,
                        as: 'Members',
                        attributes: ['id', 'name', 'email'],
                        through: { attributes: ['role', 'joined_at'] }
                    }
                ]
            }]
        });

        const families = members.map(m => {
            const familyJson = m.Family.toJSON();
            familyJson.my_role = m.role;
            
            // Format Members array similarly to getFamilyDetails
            if (familyJson.Members) {
                familyJson.members = familyJson.Members.map(member => ({
                    id: member.id,
                    name: member.name,
                    email: member.email,
                    role: member.FamilyMember.role,
                    joined_at: member.FamilyMember.joined_at
                }));
                delete familyJson.Members; // Remove uppercase nested object
            } else {
                familyJson.members = [];
            }
            
            return familyJson;
        });

        res.json(families);
    } catch (error) {
        console.error('Error fetching families:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// POST /api/families
// Create a new family
exports.createFamily = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name } = req.body;

        if (!name) return res.status(400).json({ message: 'Family name is required' });

        const sequelize = require('../models/index').sequelize;

        const result = await sequelize.transaction(async (t) => {
            // 1. Create Family
            const family = await Family.create({
                name,
                owner_id: userId
            }, { transaction: t });

            // 2. Add owner as Admin member
            await FamilyMember.create({
                family_id: family.id,
                user_id: userId,
                role: 'ADMIN',
                joined_at: new Date()
            }, { transaction: t });

            // 3. Optional: Create a default family wallet
            await Wallet.create({
                name: 'Quỹ chung gia đình',
                balance: 0,
                currency: 'VND',
                family_id: family.id
            }, { transaction: t });

            return family;
        });

        res.status(201).json(result);
    } catch (error) {
        console.error('Error creating family:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// GET /api/families/:id
// Get family details including members and wallets
exports.getFamilyDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Ensure user is member
        const memberCheck = await FamilyMember.findOne({ where: { family_id: id, user_id: userId } });
        if (!memberCheck) return res.status(403).json({ message: 'You are not a member of this family' });

        const family = await Family.findByPk(id, {
            include: [
                {
                    model: User,
                    as: 'Members',
                    attributes: ['id', 'name', 'email'],
                    through: { attributes: ['role', 'joined_at'] }
                },
                {
                    model: Wallet,
                    attributes: ['id', 'name', 'balance', 'currency']
                }
            ]
        });

        if (!family) return res.status(404).json({ message: 'Family not found' });

        res.json(family);
    } catch (error) {
        console.error('Error fetching family details:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// POST /api/families/:id/members
// Add/Invite a member by email
exports.addMember = async (req, res) => {
    try {
        const { id } = req.params;
        const { email, role } = req.body;
        const userId = req.user.id;

        // Check if caller is Admin
        const caller = await FamilyMember.findOne({ where: { family_id: id, user_id: userId } });
        if (!caller || caller.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Only Admins can add members' });
        }

        const userToAdd = await User.findOne({ where: { email } });
        if (!userToAdd) return res.status(404).json({ message: 'User with this email not found' });

        const existingMember = await FamilyMember.findOne({ where: { family_id: id, user_id: userToAdd.id } });
        if (existingMember) return res.status(400).json({ message: 'User is already a member' });

        const newMember = await FamilyMember.create({
            family_id: id,
            user_id: userToAdd.id,
            role: role || 'MEMBER',
            joined_at: new Date()
        });

        res.status(201).json(newMember);
    } catch (error) {
        console.error('Error adding member:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// DELETE /api/families/:id/members/:userIdToRemove
// Remove a member
exports.removeMember = async (req, res) => {
    try {
        const { id, userIdToRemove } = req.params;
        const callerId = req.user.id;

        const caller = await FamilyMember.findOne({ where: { family_id: id, user_id: callerId } });

        // Can remove oneself, or Admin can remove anyone
        if (caller.user_id !== userIdToRemove && caller.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Not authorized to remove this member' });
        }

        // Cannot remove the owner
        const family = await Family.findByPk(id);
        if (family.owner_id === userIdToRemove) {
            return res.status(400).json({ message: 'Cannot remove the family owner' });
        }

        await FamilyMember.destroy({ where: { family_id: id, user_id: userIdToRemove } });

        res.json({ message: 'Member removed successfully' });
    } catch (error) {
        console.error('Error removing member:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// DELETE /api/families/:id
// Delete a family
exports.deleteFamily = async (req, res) => {
    try {
        const { id } = req.params;
        const callerId = req.user.id;

        const family = await Family.findByPk(id);
        if (!family) return res.status(404).json({ message: 'Family not found' });

        if (family.owner_id !== callerId) {
            return res.status(403).json({ message: 'Only the owner can delete the family' });
        }

        const sequelize = require('../models/index').sequelize;

        await sequelize.transaction(async (t) => {
            // Delete all wallets related
            await Wallet.destroy({ where: { family_id: id }, transaction: t });
            // Delete all members
            await FamilyMember.destroy({ where: { family_id: id }, transaction: t });
            // Delete family
            await family.destroy({ transaction: t });
        });

        res.json({ message: 'Family deleted successfully' });
    } catch (error) {
        console.error('Error deleting family:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
