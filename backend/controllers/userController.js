const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { success, notFound, serverError, error: sendError } = require('../utils/responseHelper');

exports.getProfile = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: ['id', 'name', 'email', 'avatar', 'role'],
        });

        if (!user) {
            return notFound(res, 'USER_NOT_FOUND');
        }

        return success(res, user, 'PROFILE_FETCH_SUCCESS');
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return serverError(res, 'PROFILE_LOAD_FAILED');
    }
};

exports.updateAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return sendError(res, 'UPLOAD_FILE_REQUIRED', 400);
        }

        const avatarUrl = `/uploads/avatars/${req.file.filename}`;
        const user = await User.findByPk(req.user.id);

        if (!user) {
            return notFound(res, 'USER_NOT_FOUND');
        }

        user.avatar = avatarUrl;
        await user.save();

        return success(res, { avatarUrl }, 'AVATAR_UPDATE_SUCCESS');
    } catch (error) {
        console.error('Update avatar error:', error);
        return serverError(res, 'UPLOAD_FAILED');
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);

        if (!user) {
            return notFound(res, 'USER_NOT_FOUND');
        }

        await user.update({
            name: req.body.name !== undefined ? req.body.name : user.name,
        });

        return success(
            res,
            { id: user.id, name: user.name, email: user.email, avatar: user.avatar },
            'PROFILE_UPDATE_SUCCESS'
        );
    } catch (error) {
        console.error('Error updating user profile:', error);
        return serverError(res, 'PROFILE_UPDATE_FAILED');
    }
};

exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findByPk(req.user.id);

        if (!user) {
            return notFound(res, 'USER_NOT_FOUND');
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isMatch) {
            return sendError(res, 'CURRENT_PASSWORD_INCORRECT', 400);
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await user.update({ password_hash: hashedPassword });

        return success(res, null, 'PASSWORD_CHANGE_SUCCESS');
    } catch (error) {
        console.error('Error changing password:', error);
        return serverError(res, 'PASSWORD_CHANGE_FAILED');
    }
};

exports.deleteAccount = async (req, res) => {
    const { sequelize } = require('../models');
    const transaction = await sequelize.transaction();

    try {
        const { password } = req.body;
        const user = await User.findByPk(req.user.id);

        if (!user) {
            await transaction.rollback();
            return notFound(res, 'USER_NOT_FOUND');
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            await transaction.rollback();
            return sendError(res, 'CURRENT_PASSWORD_INCORRECT', 400);
        }

        const userId = req.user.id;
        const {
            AuditLog,
            Budget,
            FamilyMember,
            Goal,
            Notification,
            RecurringPattern,
            Transaction,
            TransactionShare,
            Wallet,
        } = require('../models');

        await TransactionShare.destroy({ where: { user_id: userId }, transaction });
        await Transaction.destroy({ where: { user_id: userId }, transaction });
        await Wallet.destroy({ where: { user_id: userId }, transaction });
        await Goal.destroy({ where: { user_id: userId }, transaction });
        await Budget.destroy({ where: { user_id: userId }, transaction });
        await Notification.destroy({ where: { user_id: userId }, transaction });
        await FamilyMember.destroy({ where: { user_id: userId }, transaction });
        await RecurringPattern.destroy({ where: { user_id: userId }, transaction });
        await AuditLog.destroy({ where: { user_id: userId }, transaction });
        await User.destroy({ where: { id: userId }, transaction });

        await transaction.commit();
        return success(res, null, 'ACCOUNT_DELETE_SUCCESS');
    } catch (error) {
        await transaction.rollback();
        console.error('Error deleting account:', error);
        return serverError(res, 'ACCOUNT_DELETE_FAILED');
    }
};
