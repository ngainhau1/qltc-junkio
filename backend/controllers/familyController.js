const { Family, FamilyMember, User, Wallet } = require('../models');
const { Op } = require('sequelize');
const { success, created, error: sendError, notFound, serverError } = require('../utils/responseHelper');

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

        success(res, families, 'Lấy danh sách gia đình thành công');
    } catch (err) {
        console.error('Error fetching families:', err);
        serverError(res, 'Lỗi Server: Không thể lấy danh sách gia đình');
    }
};

// POST /api/families
// Create a new family
exports.createFamily = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name } = req.body;

        if (!name) return sendError(res, 'Vui lòng nhập tên gia đình', 400);

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

        created(res, result, 'Tạo gia đình thành công');
    } catch (err) {
        console.error('Error creating family:', err);
        serverError(res, 'Lỗi Server: Không thể tạo gia đình');
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
        if (!memberCheck) return sendError(res, 'Bạn không phải là thành viên của gia đình này', 403);

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

        if (!family) return notFound(res, 'Gia đình không tồn tại');

        success(res, family, 'Lấy thông tin gia đình thành công');
    } catch (err) {
        console.error('Error fetching family details:', err);
        serverError(res, 'Lỗi Server: Không thể lấy thông tin gia đình');
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
            return sendError(res, 'Chỉ Admin mới có thể thêm thành viên', 403);
        }

        const userToAdd = await User.findOne({ where: { email } });
        if (!userToAdd) return notFound(res, 'Không tìm thấy người dùng với email này');

        const existingMember = await FamilyMember.findOne({ where: { family_id: id, user_id: userToAdd.id } });
        if (existingMember) return sendError(res, 'Người dùng đã là thành viên', 400);

        const newMember = await FamilyMember.create({
            family_id: id,
            user_id: userToAdd.id,
            role: role || 'MEMBER',
            joined_at: new Date()
        });

        created(res, newMember, 'Thêm thành viên thành công');
    } catch (err) {
        console.error('Error adding member:', err);
        serverError(res, 'Lỗi Server: Không thể thêm thành viên');
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
            return sendError(res, 'Không có quyền xóa thành viên này', 403);
        }

        // Cannot remove the owner
        const family = await Family.findByPk(id);
        if (family.owner_id === userIdToRemove) {
            return sendError(res, 'Không thể xóa chủ gia đình', 400);
        }

        await FamilyMember.destroy({ where: { family_id: id, user_id: userIdToRemove } });

        success(res, null, 'Đã xóa thành viên thành công');
    } catch (err) {
        console.error('Error removing member:', err);
        serverError(res, 'Lỗi Server: Không thể xóa thành viên');
    }
};

// DELETE /api/families/:id
// Delete a family
exports.deleteFamily = async (req, res) => {
    try {
        const { id } = req.params;
        const callerId = req.user.id;

        const family = await Family.findByPk(id);
        if (!family) return notFound(res, 'Gia đình không tồn tại');

        if (family.owner_id !== callerId) {
            return sendError(res, 'Chỉ chủ gia đình mới được quyền xóa', 403);
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

        success(res, null, 'Xóa gia đình thành công');
    } catch (err) {
        console.error('Error deleting family:', err);
        serverError(res, 'Lỗi Server: Không thể xóa gia đình');
    }
};
