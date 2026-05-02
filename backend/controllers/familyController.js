const crypto = require('crypto');
const { Family, FamilyMember, FamilyInvitation, User, Wallet, sequelize } = require('../models');
const { success, created, error: sendError, notFound, serverError } = require('../utils/responseHelper');

const INVITATION_TTL_DAYS = 7;
const INVITATION_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

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

function serializeInvitation(invitation) {
    const payload = invitation.toJSON ? invitation.toJSON() : invitation;
    return {
        id: payload.id,
        family_id: payload.family_id,
        familyId: payload.family_id,
        code: payload.code,
        role: payload.role,
        expires_at: payload.expires_at,
        expiresAt: payload.expires_at,
        used_at: payload.used_at,
        usedAt: payload.used_at,
    };
}

function generateInvitationCode() {
    const bytes = crypto.randomBytes(8);
    return Array.from(bytes)
        .map((byte) => INVITATION_ALPHABET[byte % INVITATION_ALPHABET.length])
        .join('');
}

async function isFamilyAdmin(familyId, userId) {
    const [family, caller] = await Promise.all([
        Family.findByPk(familyId),
        FamilyMember.findOne({ where: { family_id: familyId, user_id: userId } }),
    ]);

    if (!family) {
        return { family: null, caller: null, allowed: false };
    }

    return {
        family,
        caller,
        allowed: String(family.owner_id) === String(userId) || caller?.role === 'ADMIN',
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

exports.createInvitation = async (req, res) => {
    try {
        const { id } = req.params;
        const { family, allowed } = await isFamilyAdmin(id, req.user.id);

        if (!family) {
            return notFound(res, 'FAMILY_NOT_FOUND');
        }

        if (!allowed) {
            return sendError(res, 'FAMILY_ADMIN_REQUIRED', 403);
        }

        let code = null;
        for (let attempt = 0; attempt < 10; attempt += 1) {
            const candidate = generateInvitationCode();
            const existing = await FamilyInvitation.findOne({ where: { code: candidate } });
            if (!existing) {
                code = candidate;
                break;
            }
        }

        if (!code) {
            return serverError(res, 'FAMILY_INVITATION_CREATE_FAILED');
        }

        const expiresAt = new Date(Date.now() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000);
        const invitation = await FamilyInvitation.create({
            family_id: id,
            code,
            role: 'MEMBER',
            created_by: req.user.id,
            expires_at: expiresAt,
        });

        return created(res, serializeInvitation(invitation), 'FAMILY_INVITATION_CREATED');
    } catch (error) {
        console.error('Error creating family invitation:', error);
        return serverError(res, 'FAMILY_INVITATION_CREATE_FAILED');
    }
};

exports.joinByInvitation = async (req, res) => {
    try {
        const code = String(req.body.code || '').trim().toUpperCase();

        const result = await sequelize.transaction(async (transaction) => {
            const invitation = await FamilyInvitation.findOne({
                where: { code },
                transaction,
            });

            if (!invitation) {
                return { error: 'FAMILY_INVITATION_INVALID', statusCode: 404 };
            }

            if (invitation.used_at) {
                return { error: 'FAMILY_INVITATION_USED', statusCode: 400 };
            }

            if (new Date(invitation.expires_at).getTime() < Date.now()) {
                return { error: 'FAMILY_INVITATION_EXPIRED', statusCode: 400 };
            }

            const family = await Family.findByPk(invitation.family_id, { transaction });
            if (!family) {
                return { error: 'FAMILY_NOT_FOUND', statusCode: 404 };
            }

            const existingMember = await FamilyMember.findOne({
                where: { family_id: invitation.family_id, user_id: req.user.id },
                transaction,
            });

            if (existingMember) {
                return { error: 'FAMILY_MEMBER_ALREADY_EXISTS', statusCode: 400 };
            }

            await FamilyMember.create({
                family_id: invitation.family_id,
                user_id: req.user.id,
                role: invitation.role || 'MEMBER',
                joined_at: new Date(),
            }, { transaction });

            invitation.used_at = new Date();
            invitation.used_by = req.user.id;
            await invitation.save({ transaction });

            const familySummary = await loadFamilySummary(invitation.family_id, req.user.id, transaction);
            return { family: familySummary };
        });

        if (result.error) {
            return sendError(res, result.error, result.statusCode);
        }

        return created(res, result.family, 'FAMILY_JOIN_SUCCESS');
    } catch (error) {
        console.error('Error joining family by invitation:', error);
        return serverError(res, 'FAMILY_JOIN_FAILED');
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
