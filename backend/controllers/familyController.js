const { Family, FamilyMember, User, Wallet, sequelize } = require('../models');
const { success, created, error: sendError, notFound, serverError } = require('../utils/responseHelper');

const familyListInclude = [
    {
        model: User,
        as: 'Owner',
        attributes: ['id', 'name', 'email'],
    },
    {
        model: User,
        as: 'Members',
        attributes: ['id', 'name', 'email'],
        through: { attributes: ['role', 'joined_at'] },
    },
];

const familyDetailInclude = [
    ...familyListInclude,
    {
        model: Wallet,
        attributes: ['id', 'name', 'balance', 'currency', 'family_id'],
    },
];

function normalizeMember(member) {
    return {
        id: member.id,
        name: member.name,
        email: member.email,
        role: member.FamilyMember?.role || member.role || 'MEMBER',
        joined_at: member.FamilyMember?.joined_at || member.joined_at || null,
    };
}

function normalizeFamilyRecord(familyRecord, myRole = null) {
    const familyJson = familyRecord.toJSON ? familyRecord.toJSON() : familyRecord;
    const members = Array.isArray(familyJson.Members)
        ? familyJson.Members.map(normalizeMember)
        : Array.isArray(familyJson.members)
            ? familyJson.members
            : [];
    const wallets = Array.isArray(familyJson.Wallets)
        ? familyJson.Wallets
        : Array.isArray(familyJson.wallets)
            ? familyJson.wallets
            : [];

    return {
        id: familyJson.id,
        name: familyJson.name,
        owner_id: familyJson.owner_id,
        owner: familyJson.Owner || familyJson.owner || null,
        members,
        wallets,
        my_role: myRole || familyJson.my_role || null,
        createdAt: familyJson.createdAt,
        updatedAt: familyJson.updatedAt,
    };
}

async function loadFamilySummary(familyId, userId, transaction) {
    const memberRecord = await FamilyMember.findOne({
        where: { family_id: familyId, user_id: userId },
        transaction,
    });

    if (!memberRecord) {
        return null;
    }

    const family = await Family.findByPk(familyId, {
        include: familyDetailInclude,
        transaction,
    });

    if (!family) {
        return null;
    }

    return normalizeFamilyRecord(family, memberRecord.role);
}

exports.getUserFamilies = async (req, res) => {
    try {
        const userId = req.user.id;

        const memberships = await FamilyMember.findAll({
            where: { user_id: userId },
            include: [{
                model: Family,
                include: familyListInclude,
            }],
        });

        const families = memberships.map((membership) =>
            normalizeFamilyRecord(membership.Family, membership.role)
        );

        success(res, families, 'L?y danh s?ch gia ??nh th?nh c?ng');
    } catch (err) {
        console.error('Error fetching families:', err);
        serverError(res, 'Kh?ng th? l?y danh s?ch gia ??nh');
    }
};

exports.createFamily = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name } = req.body;

        if (!name) {
            return sendError(res, 'Vui l?ng nh?p t?n gia ??nh', 400);
        }

        const result = await sequelize.transaction(async (transaction) => {
            const family = await Family.create({
                name,
                owner_id: userId,
            }, { transaction });

            await FamilyMember.create({
                family_id: family.id,
                user_id: userId,
                role: 'ADMIN',
                joined_at: new Date(),
            }, { transaction });

            await Wallet.create({
                name: 'Qu? chung gia ??nh',
                balance: 0,
                currency: 'VND',
                family_id: family.id,
            }, { transaction });

            return loadFamilySummary(family.id, userId, transaction);
        });

        created(res, result, 'T?o gia ??nh th?nh c?ng');
    } catch (err) {
        console.error('Error creating family:', err);
        serverError(res, 'Kh?ng th? t?o gia ??nh');
    }
};

exports.getFamilyDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const memberCheck = await FamilyMember.findOne({ where: { family_id: id, user_id: userId } });
        if (!memberCheck) {
            return sendError(res, 'B?n kh?ng ph?i l? th?nh vi?n c?a gia ??nh n?y', 403);
        }

        const family = await Family.findByPk(id, {
            include: familyDetailInclude,
        });

        if (!family) {
            return notFound(res, 'Gia ??nh kh?ng t?n t?i');
        }

        success(res, normalizeFamilyRecord(family, memberCheck.role), 'L?y th?ng tin gia ??nh th?nh c?ng');
    } catch (err) {
        console.error('Error fetching family details:', err);
        serverError(res, 'Kh?ng th? l?y th?ng tin gia ??nh');
    }
};

exports.addMember = async (req, res) => {
    try {
        const { id } = req.params;
        const { email, role } = req.body;
        const userId = req.user.id;

        const caller = await FamilyMember.findOne({ where: { family_id: id, user_id: userId } });
        if (!caller || caller.role !== 'ADMIN') {
            return sendError(res, 'Ch? Admin m?i c? th? th?m th?nh vi?n', 403);
        }

        const userToAdd = await User.findOne({ where: { email } });
        if (!userToAdd) {
            return notFound(res, 'Kh?ng t?m th?y ng??i d?ng v?i email n?y');
        }

        const existingMember = await FamilyMember.findOne({ where: { family_id: id, user_id: userToAdd.id } });
        if (existingMember) {
            return sendError(res, 'Ng??i d?ng ?? l? th?nh vi?n', 400);
        }

        const newMember = await FamilyMember.create({
            family_id: id,
            user_id: userToAdd.id,
            role: role || 'MEMBER',
            joined_at: new Date(),
        });

        created(res, newMember, 'Th?m th?nh vi?n th?nh c?ng');
    } catch (err) {
        console.error('Error adding member:', err);
        serverError(res, 'Kh?ng th? th?m th?nh vi?n');
    }
};

exports.removeMember = async (req, res) => {
    try {
        const { id, userIdToRemove } = req.params;
        const callerId = req.user.id;

        const caller = await FamilyMember.findOne({ where: { family_id: id, user_id: callerId } });
        if (!caller) {
            return sendError(res, 'B?n kh?ng ph?i l? th?nh vi?n c?a gia ??nh n?y', 403);
        }

        if (String(caller.user_id) !== String(userIdToRemove) && caller.role !== 'ADMIN') {
            return sendError(res, 'Kh?ng c? quy?n x?a th?nh vi?n n?y', 403);
        }

        const family = await Family.findByPk(id);
        if (!family) {
            return notFound(res, 'Gia ??nh kh?ng t?n t?i');
        }

        if (String(family.owner_id) === String(userIdToRemove)) {
            return sendError(res, 'Kh?ng th? x?a ch? gia ??nh', 400);
        }

        await FamilyMember.destroy({ where: { family_id: id, user_id: userIdToRemove } });

        success(res, null, '?? x?a th?nh vi?n th?nh c?ng');
    } catch (err) {
        console.error('Error removing member:', err);
        serverError(res, 'Kh?ng th? x?a th?nh vi?n');
    }
};

exports.deleteFamily = async (req, res) => {
    try {
        const { id } = req.params;
        const callerId = req.user.id;

        const family = await Family.findByPk(id);
        if (!family) {
            return notFound(res, 'Gia ??nh kh?ng t?n t?i');
        }

        if (String(family.owner_id) !== String(callerId)) {
            return sendError(res, 'Ch? ch? gia ??nh m?i ???c quy?n x?a', 403);
        }

        await sequelize.transaction(async (transaction) => {
            await Wallet.destroy({ where: { family_id: id }, transaction });
            await FamilyMember.destroy({ where: { family_id: id }, transaction });
            await family.destroy({ transaction });
        });

        success(res, null, 'X?a gia ??nh th?nh c?ng');
    } catch (err) {
        console.error('Error deleting family:', err);
        serverError(res, 'Kh?ng th? x?a gia ??nh');
    }
};
