const { Wallet, Transaction, FamilyMember } = require('../models');
const { Op, fn, col, where } = require('sequelize');
const { success, error, notFound, serverError, created } = require('../utils/responseHelper');

// GHI CHÚ HỌC TẬP - Phần ví của Thành Đạt:
// Controller này xử lý ví cá nhân và ví gia đình. Điểm quan trọng nhất là mọi thao tác
// đều phải kiểm tra phạm vi truy cập để người dùng không xem/sửa/xóa ví của người khác.

/**
 * Lấy danh sách family_id mà user đang tham gia.
 * Danh sách này dùng để cho phép user nhìn thấy ví gia đình bên cạnh ví cá nhân.
 */
const getUserFamilyIds = async (userId) => {
    const userFamilies = await FamilyMember.findAll({
        where: { user_id: userId },
        attributes: ['family_id']
    });
    return userFamilies.map((f) => f.family_id);
};

/**
 * Tạo điều kiện truy vấn ví theo quyền truy cập.
 * Nếu có id, chỉ tìm một ví cụ thể; nếu không có id, lấy toàn bộ ví user được phép xem.
 */
const buildWalletAccessWhere = (id, userId, familyIds) => ({
    ...(id ? { id } : {}),
    [Op.or]: [
        { user_id: userId },
        ...(familyIds.length > 0 ? [{ family_id: { [Op.in]: familyIds } }] : [])
    ]
});

/**
 * Kiểm tra trùng tên ví trong cùng phạm vi.
 * Ví cá nhân chỉ so với ví cá nhân của user; ví gia đình chỉ so trong family đó.
 */
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
        // Khi sửa ví, bỏ qua chính ví đang sửa để không tự báo trùng với nó.
        whereClause.id = { [Op.ne]: excludeId };
    }

    const existed = await Wallet.findOne({ where: whereClause, attributes: ['id'] });
    return Boolean(existed);
};

// GET /api/wallets
/**
 * Lấy danh sách tất cả các ví mà người dùng có quyền truy cập.
 * - Bao gồm ví cá nhân (tự tạo).
 * - Bao gồm các ví dùng chung của các nhóm Gia đình mà user là thành viên.
 */
exports.getUserWallets = async (req, res) => {
    try {
        const userId = req.user.id;
        // familyIds quyết định user được nhìn thấy những ví gia đình nào.
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

// POST /api/wallets
/**
 * Tạo ví mới.
 * - Cho phép tạo ví cá nhân hoặc gán ví vào một nhóm Gia đình (nếu user có quyền).
 * - Kiểm tra trùng tên ví trong cùng một phạm vi (cá nhân hoặc gia đình).
 */
exports.createWallet = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, balance, currency, family_id } = req.body;
        const normalizedName = String(name || '').trim();
        const familyIds = await getUserFamilyIds(userId);

        if (family_id && !familyIds.includes(family_id)) {
            // Không cho tạo ví trong một gia đình mà user không thuộc về.
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
            // Ví gia đình dùng family_id và để user_id null; ví cá nhân làm ngược lại.
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

// PUT /api/wallets/:id
/**
 * Cập nhật thông tin ví.
 * - Cho phép đổi tên, số dư khởi tạo hoặc loại tiền tệ.
 * - Kiểm tra quyền sở hữu/quyền truy cập trước khi thực hiện.
 */
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
            // Trả 404 thay vì 403 để không tiết lộ ví có tồn tại nhưng thuộc người khác hay không.
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

// DELETE /api/wallets/:id
/**
 * Xóa ví.
 * - Ràng buộc: Không cho phép xóa nếu ví đã có các giao dịch phát sinh để đảm bảo toàn vẹn dữ liệu.
 */
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
            // Không xóa ví đã có giao dịch để giữ toàn vẹn lịch sử thu chi.
            return error(res, 'WALLET_HAS_TRANSACTIONS', 400);
        }

        await wallet.destroy();

        success(res, null, 'WALLET_DELETED');
    } catch (err) {
        console.error('Error deleting wallet:', err);
        serverError(res, 'WALLET_DELETE_FAILED');
    }
};
