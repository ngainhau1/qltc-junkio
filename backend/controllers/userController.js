const { User } = require('../models');
const bcrypt = require('bcryptjs');
const { success, notFound, serverError, error: sendError } = require('../utils/responseHelper');

// GET /api/users/me
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: ['id', 'name', 'email', 'avatar', 'role']
        });
        if (!user) return notFound(res, 'Người dùng không tồn tại');

        success(res, user, 'Lấy thông tin người dùng thành công');
    } catch (err) {
        console.error('Error fetching user profile:', err);
        serverError(res, 'Lỗi Server: Không thể lấy thông tin người dùng');
    }
};

// POST /api/users/me/avatar
exports.updateAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return sendError(res, 'No file uploaded', 400);
        }

        const avatarUrl = `/uploads/avatars/${req.file.filename}`;

        const user = await User.findByPk(req.user.id);
        if (!user) {
            return notFound(res, 'Người dùng không tồn tại');
        }

        user.avatar = avatarUrl;
        await user.save();

        success(res, { avatarUrl }, 'Cập nhật avatar thành công');
    } catch (err) {
        console.error('Update avatar error:', err.message);
        serverError(res, 'Lỗi Server: Không thể cập nhật ảnh đại diện');
    }
};

// PUT /api/users/me
exports.updateProfile = async (req, res) => {
    try {
        const { name } = req.body;
        // Avatar upload handling would go here with multer
        const user = await User.findByPk(req.user.id);

        await user.update({
            name: name !== undefined ? name : user.name,
        });

        success(res, { id: user.id, name: user.name, email: user.email, avatar: user.avatar }, 'Cập nhật thông tin thành công');
    } catch (err) {
        console.error('Error updating user profile:', err);
        serverError(res, 'Lỗi Server: Không thể cập nhật thông tin');
    }
};

// PUT /api/users/me/password
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // Security: Validate input
        if (!currentPassword || !newPassword) {
            return sendError(res, 'Vui lòng nhập đầy đủ mật khẩu', 400);
        }
        if (newPassword.length < 6) {
            return sendError(res, 'Mật khẩu mới phải có ít nhất 6 ký tự', 400);
        }

        const user = await User.findByPk(req.user.id);

        const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isMatch) return sendError(res, 'Mật khẩu hiện tại không đúng', 400);

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await user.update({ password_hash: hashedPassword });

        success(res, null, 'Đổi mật khẩu thành công');
    } catch (err) {
        console.error('Error changing password:', err);
        serverError(res, 'Lỗi Server: Không thể đổi mật khẩu');
    }
};

// DELETE /api/users/me
exports.deleteAccount = async (req, res) => {
    const { sequelize } = require('../models');
    const t = await sequelize.transaction();
    try {
        const { password } = req.body;
        if (!password) {
            return sendError(res, 'Vui lòng nhập mật khẩu để xác thực', 400);
        }

        const user = await User.findByPk(req.user.id);
        if (!user) return notFound(res, 'Người dùng không tồn tại');

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return sendError(res, 'Mật khẩu không đúng', 400);

        const userId = req.user.id;

        // Cascade delete in correct order (dependencies first)
        const { TransactionShare, Transaction, Wallet, Goal, Budget, Notification, FamilyMember, RecurringPattern, AuditLog } = require('../models');

        await TransactionShare.destroy({ where: { user_id: userId }, transaction: t });
        await Transaction.destroy({ where: { user_id: userId }, transaction: t });
        await Wallet.destroy({ where: { user_id: userId }, transaction: t });
        await Goal.destroy({ where: { user_id: userId }, transaction: t });
        await Budget.destroy({ where: { user_id: userId }, transaction: t });
        await Notification.destroy({ where: { user_id: userId }, transaction: t });
        await FamilyMember.destroy({ where: { user_id: userId }, transaction: t });
        await RecurringPattern.destroy({ where: { user_id: userId }, transaction: t });
        await AuditLog.destroy({ where: { user_id: userId }, transaction: t });
        await User.destroy({ where: { id: userId }, transaction: t });

        await t.commit();
        success(res, null, 'Tài khoản đã được xóa vĩnh viễn');
    } catch (err) {
        await t.rollback();
        console.error('Error deleting account:', err);
        serverError(res, 'Lỗi Server: Không thể xóa tài khoản');
    }
};
