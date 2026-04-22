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
        const memberships = await FamilyMember.findAll({
            where: { user_id: req.user.id },
            include: [
                {
                    model: Family,
                    include: familyListInclude,
                },
            ],
        });

        const families = memberships.map((membership) =>
            normalizeFamilyRecord(membership.Family, membership.role)
        );

        return success(res, families, 'FAMILY_LIST_FETCH_SUCCESS');
    } catch (error) {
        console.error('Error fetching families:', error);
        return serverError(res, 'FAMILY_LOAD_FAILED');
    }
};

exports.createFamily = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name } = req.body;

        const result = await sequelize.transaction(async (transaction) => {
            const family = await Family.create(
                {
                    name,
                    owner_id: userId,
                },
                { transaction }
            );

            await FamilyMember.create(
                {
                    family_id: family.id,
                    user_id: userId,
                    role: 'ADMIN',
                    joined_at: new Date(),
                },
                { transaction }
            );

            await Wallet.create(
                {
                    name: 'Quỹ chung gia đình',
                    balance: 0,
                    currency: 'VND',
                    family_id: family.id,
                },
                { transaction }
            );

            return loadFamilySummary(family.id, userId, transaction);
        });

        return created(res, result, 'FAMILY_CREATE_SUCCESS');
    } catch (error) {
        console.error('Error creating family:', error);
        return serverError(res, 'FAMILY_CREATE_FAILED');
    }
};

exports.getFamilyDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const memberCheck = await FamilyMember.findOne({
            where: { family_id: id, user_id: req.user.id },
        });

        if (!memberCheck) {
            return sendError(res, 'FAMILY_FORBIDDEN', 403);
        }

        const family = await Family.findByPk(id, {
            include: familyDetailInclude,
        });

        if (!family) {
            return notFound(res, 'FAMILY_NOT_FOUND');
        }

        return success(
            res,
            normalizeFamilyRecord(family, memberCheck.role),
            'FAMILY_DETAIL_FETCH_SUCCESS'
        );
    } catch (error) {
        console.error('Error fetching family details:', error);
        return serverError(res, 'FAMILY_DETAIL_FAILED');
    }
};

exports.addMember = async (req, res) => {
    try {
        const { id } = req.params;
        const { email, role } = req.body;

        const caller = await FamilyMember.findOne({
            where: { family_id: id, user_id: req.user.id },
        });

        if (!caller || caller.role !== 'ADMIN') {
            return sendError(res, 'FAMILY_ADMIN_REQUIRED', 403);
        }

        const userToAdd = await User.findOne({ where: { email } });
        if (!userToAdd) {
            return notFound(res, 'USER_NOT_FOUND');
        }

        const existingMember = await FamilyMember.findOne({
            where: { family_id: id, user_id: userToAdd.id },
        });

        if (existingMember) {
            return sendError(res, 'FAMILY_MEMBER_ALREADY_EXISTS', 400);
        }

        const newMember = await FamilyMember.create({
            family_id: id,
            user_id: userToAdd.id,
            role: role || 'MEMBER',
            joined_at: new Date(),
        });

        return created(res, newMember, 'FAMILY_MEMBER_ADD_SUCCESS');
    } catch (error) {
        console.error('Error adding member:', error);
        return serverError(res, 'FAMILY_INVITE_FAILED');
    }
};

exports.removeMember = async (req, res) => {
    try {
        const { id, userIdToRemove } = req.params;
        const caller = await FamilyMember.findOne({
            where: { family_id: id, user_id: req.user.id },
        });

        if (!caller) {
            return sendError(res, 'FAMILY_FORBIDDEN', 403);
        }

        if (String(caller.user_id) !== String(userIdToRemove) && caller.role !== 'ADMIN') {
            return sendError(res, 'FAMILY_FORBIDDEN', 403);
        }

        const family = await Family.findByPk(id);
        if (!family) {
            return notFound(res, 'FAMILY_NOT_FOUND');
        }

        if (String(family.owner_id) === String(userIdToRemove)) {
            return sendError(res, 'FAMILY_OWNER_CANNOT_BE_REMOVED', 400);
        }

        await FamilyMember.destroy({ where: { family_id: id, user_id: userIdToRemove } });

        return success(res, null, 'FAMILY_MEMBER_REMOVE_SUCCESS');
    } catch (error) {
        console.error('Error removing member:', error);
        return serverError(res, 'FAMILY_REMOVE_FAILED');
    }
};

exports.deleteFamily = async (req, res) => {
    try {
        const { id } = req.params;
        const family = await Family.findByPk(id);

        if (!family) {
            return notFound(res, 'FAMILY_NOT_FOUND');
        }

        if (String(family.owner_id) !== String(req.user.id)) {
            return sendError(res, 'FAMILY_OWNER_REQUIRED', 403);
        }

        await sequelize.transaction(async (transaction) => {
            await Wallet.destroy({ where: { family_id: id }, transaction });
            await FamilyMember.destroy({ where: { family_id: id }, transaction });
            await family.destroy({ transaction });
        });

        return success(res, null, 'FAMILY_DELETE_SUCCESS');
    } catch (error) {
        console.error('Error deleting family:', error);
        return serverError(res, 'FAMILY_DELETE_FAILED');
    }
};
