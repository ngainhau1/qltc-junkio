const { TransactionShare, Transaction, Wallet, User, sequelize, Notification } = require('../models');
const { success, error: sendError, notFound, serverError } = require('../utils/responseHelper');
const { serializeNotification } = require('../utils/notificationPresenter');

// GET /api/debts/pending
exports.getPendingDebts = async (req, res) => {
    try {
        const userId = req.user.id; // User hiện tại xem danh sách nợ cần duyệt
        const pendingShares = await TransactionShare.findAll({
            where: {
                user_id: userId,
                approval_status: 'PENDING'
            },
            include: [{
                model: Transaction,
                as: 'Transaction',
                include: [{ model: User, attributes: ['id', 'name'] }]
            }]
        });
        success(res, pendingShares, 'Lấy danh sách nợ chờ duyệt thành công');
    } catch (err) {
        console.error(err);
        serverError(res, 'Lỗi hệ thống: Lỗi lấy danh sách nợ chờ duyệt.');
    }
};

// PUT /api/debts/:shareId/approve
exports.approveShare = async (req, res) => {
    try {
        const share = await TransactionShare.findByPk(req.params.shareId);
        if (!share) return notFound(res, 'Không tìm thấy khoản nợ.');
        if (share.user_id !== req.user.id) return sendError(res, 'Không có quyền duyệt nợ thay người khác.', 403);

        share.approval_status = 'APPROVED';
        await share.save();
        success(res, share, 'Đã chấp nhận khoản nợ');
    } catch (err) {
        console.error(err);
        serverError(res, 'Lỗi hệ thống.');
    }
};

// PUT /api/debts/:shareId/reject
exports.rejectShare = async (req, res) => {
    try {
        const share = await TransactionShare.findByPk(req.params.shareId);
        if (!share) return notFound(res, 'Không tìm thấy khoản nợ.');
        if (share.user_id !== req.user.id) return sendError(res, 'Không có quyền từ chối nợ thay người khác.', 403);

        share.approval_status = 'REJECTED';
        await share.save();
        success(res, share, 'Đã từ chối khoản nợ');
    } catch (err) {
        console.error(err);
        serverError(res, 'Lỗi hệ thống.');
    }
};

// POST /api/debts/settle
// Body: { to_user_id, amount, from_wallet_id, to_wallet_id }
exports.settleDebt = async (req, res) => {
    const { to_user_id, amount, from_wallet_id, to_wallet_id } = req.body;
    const from_user_id = req.user.id; // Security: LUÔN dùng user đang đăng nhập

    // Security: Validate amount
    if (!amount || parseFloat(amount) <= 0) {
        return sendError(res, 'Số tiền thanh toán phải lớn hơn 0', 400);
    }

    const t = await sequelize.transaction();
    try {
        // 1. Tạo Transaction TRANSFER
        const fromWallet = await Wallet.findByPk(from_wallet_id, { transaction: t });
        let toWallet;

        if (from_wallet_id === to_wallet_id) {
            toWallet = fromWallet;
            // No net change to balance if it's the exact same wallet conceptually
        } else {
            toWallet = await Wallet.findByPk(to_wallet_id, { transaction: t });
            if (!fromWallet || !toWallet) throw new Error('Ví không hợp lệ');

            fromWallet.balance = parseFloat(fromWallet.balance) - parseFloat(amount);
            toWallet.balance = parseFloat(toWallet.balance) + parseFloat(amount);

            await fromWallet.save({ transaction: t });
            await toWallet.save({ transaction: t });
        }

        const transferTxOut = await Transaction.create({
            amount: amount,
            date: new Date(),
            description: `Trả nợ cho user ${to_user_id}`,
            type: 'TRANSFER_OUT',
            wallet_id: from_wallet_id,
            user_id: from_user_id
        }, { transaction: t });

        const transferTxIn = await Transaction.create({
            amount: amount,
            date: new Date(),
            description: `Nhận tiền trả nợ từ ${from_user_id}`,
            type: 'TRANSFER_IN',
            wallet_id: to_wallet_id,
            user_id: to_user_id
        }, { transaction: t });

        // 2. Tìm tất cả các TransactionShare đang nợ giữa 2 người và gạch nợ (đổi thành PAID)
        // Tìm các khoản mà from_user_id nợ to_user_id (đã APPROVED)
        const unpaidShares = await TransactionShare.findAll({
            where: {
                user_id: from_user_id,
                status: 'UNPAID',
                approval_status: 'APPROVED'
            },
            include: [{
                model: Transaction,
                as: 'Transaction',
                where: { user_id: to_user_id }
            }],
            transaction: t
        });

        let remainingAmountToSettle = parseFloat(amount);

        for (let share of unpaidShares) {
            if (remainingAmountToSettle <= 0) break;
            const shareAmount = parseFloat(share.amount);

            // Xóa nợ toàn phần hoặc 1 phần (để đơn giản ta mark PAID nếu trả đủ hoặc dôi ra)
            if (remainingAmountToSettle >= shareAmount) {
                share.status = 'PAID';
                remainingAmountToSettle -= shareAmount;
            } else {
                // Trả một phần nợ
                share.amount = shareAmount - remainingAmountToSettle;
                remainingAmountToSettle = 0;
            }
            await share.save({ transaction: t });
        }

        await t.commit();

        try {
            if (Notification) {
                const fromUser = await User.findByPk(from_user_id);
                const fromUserName = fromUser ? fromUser.name : 'Người dùng không xác định';

                const payload = JSON.stringify({
                    key: 'notifications.debtSettledMsg',
                    params: { amount: amount.toString(), from: fromUserName }
                });

                const notif = await Notification.create({
                    user_id: to_user_id,
                    type: 'DEBT_SETTLED',
                    title: 'notifications.debtSettledTitle',
                    message: payload
                });
                const io = require('../config/socket').getIO();
                io.to(to_user_id).emit('NEW_NOTIFICATION', serializeNotification(notif));
            }
        } catch (err) {
            console.error('Socket emit error:', err);
        }

        success(res, null, 'Thanh toán bù trừ thành công');

    } catch (err) {
        await t.rollback();
        console.error(err);
        serverError(res, 'Thanh toán nợ thất bại: ' + err.message);
    }
};

// GET /api/debts/simplified/:familyId
// Thuật toán Tham lam (Greedy) tối ưu hóa mạng lưới nợ trong gia đình
exports.getSimplifiedDebts = async (req, res) => {
    try {
        const { familyId } = req.params;

        // 1. Lấy tất cả TransactionShare UNPAID + APPROVED trong family
        const shares = await TransactionShare.findAll({
            where: { status: 'UNPAID', approval_status: 'APPROVED' },
            include: [{
                model: Transaction,
                as: 'Transaction',
                required: true,
                include: [{
                    model: Wallet,
                    required: true,
                    where: { family_id: familyId }
                }]
            }]
        });

        // 2. Định dạng lại Input cho hàm Thuật toán
        const mappedDebts = shares.map(share => ({
            debtor: share.user_id,
            creditor: share.Transaction.user_id,
            amount: share.amount
        }));

        // 3. Sử dụng Core Algorithm (Tham Lam + Bipartite Graph Matching)
        const { simplifyDebts } = require('../services/debtService');
        const suggestions = simplifyDebts(mappedDebts);

        // 4. Enrich với thông tin user (tên, avatar)
        const userIds = [...new Set(suggestions.flatMap(s => [s.from, s.to]))];
        const users = await User.findAll({
            where: { id: userIds },
            attributes: ['id', 'name', 'avatar']
        });
        const userMap = Object.fromEntries(users.map(u => [u.id, { id: u.id, name: u.name, avatar: u.avatar }]));

        const result = suggestions.map(s => ({
            from: userMap[s.from] || { id: s.from, name: 'Unknown' },
            to: userMap[s.to] || { id: s.to, name: 'Unknown' },
            amount: s.amount
        }));

        success(res, {
            originalTransactions: shares.length,
            simplifiedTransactions: result.length,
            suggestions: result
        }, 'Tối ưu hóa nợ thành công');
    } catch (err) {
        console.error('Debt simplification error:', err);
        serverError(res, 'Lỗi Server');
    }
};
