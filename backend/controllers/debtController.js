const { TransactionShare, Transaction, Wallet, User, sequelize, Notification } = require('../models');

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
        res.json(pendingShares);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi lấy danh sách nợ chờ duyệt.' });
    }
};

// PUT /api/debts/:shareId/approve
exports.approveShare = async (req, res) => {
    try {
        const share = await TransactionShare.findByPk(req.params.shareId);
        if (!share) return res.status(404).json({ message: 'Không tìm thấy khoản nợ.' });
        if (share.user_id !== req.user.id) return res.status(403).json({ message: 'Không có quyền duyệt nợ thay người khác.' });

        share.approval_status = 'APPROVED';
        await share.save();
        res.json({ message: 'Đã chấp nhận khoản nợ', share });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi hệ thống.' });
    }
};

// PUT /api/debts/:shareId/reject
exports.rejectShare = async (req, res) => {
    try {
        const share = await TransactionShare.findByPk(req.params.shareId);
        if (!share) return res.status(404).json({ message: 'Không tìm thấy khoản nợ.' });
        if (share.user_id !== req.user.id) return res.status(403).json({ message: 'Không có quyền từ chối nợ thay người khác.' });

        share.approval_status = 'REJECTED';
        await share.save();
        res.json({ message: 'Đã từ chối khoản nợ', share });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi hệ thống.' });
    }
};

// POST /api/debts/settle
// Body: { to_user_id, amount, from_wallet_id, to_wallet_id }
exports.settleDebt = async (req, res) => {
    const { to_user_id, amount, from_wallet_id, to_wallet_id } = req.body;
    const from_user_id = req.user.id; // Security: LUÔN dùng user đang đăng nhập

    // Security: Validate amount
    if (!amount || parseFloat(amount) <= 0) {
        return res.status(400).json({ message: 'Số tiền thanh toán phải lớn hơn 0' });
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
                const notif = await Notification.create({
                    user_id: to_user_id,
                    type: 'DEBT_SETTLED',
                    title: 'Nợ đã được thanh toán',
                    message: `Bạn vừa nhận được khoản trả nợ ${amount} từ người dùng có ID ${from_user_id}.`
                });
                const io = require('../config/socket').getIO();
                io.to(to_user_id).emit('NEW_NOTIFICATION', notif);
            }
        } catch (err) {
            console.error('Socket emit error:', err);
        }

        res.json({ message: 'Thanh toán bù trừ thành công' });

    } catch (error) {
        await t.rollback();
        console.error(error);
        res.status(500).json({ message: 'Settle Debt failed: ' + error.message });
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
                model: Transaction, as: 'Transaction',
                include: [{ model: Wallet, where: { family_id: familyId } }]
            }]
        });

        // 2. Tính Net Balance mỗi người (số dư ròng)
        const balances = {};
        for (const share of shares) {
            const debtor = share.user_id;               // người nợ
            const creditor = share.Transaction.user_id;  // người chi (chủ nợ)
            const amount = parseFloat(share.amount);

            balances[debtor] = (balances[debtor] || 0) - amount;
            balances[creditor] = (balances[creditor] || 0) + amount;
        }

        // 3. Phân mảnh: Tách Debtors (< 0) và Creditors (> 0)
        const debtors = [];
        const creditors = [];
        for (const [userId, balance] of Object.entries(balances)) {
            if (balance < -0.01) debtors.push({ userId, amount: Math.abs(balance) });
            else if (balance > 0.01) creditors.push({ userId, amount: balance });
        }

        // Sắp xếp giảm dần theo giá trị tuyệt đối
        debtors.sort((a, b) => b.amount - a.amount);
        creditors.sort((a, b) => b.amount - a.amount);

        // 4. Ghép cặp Tham lam (Greedy Matching)
        const suggestions = [];
        let i = 0, j = 0;
        while (i < debtors.length && j < creditors.length) {
            const transferAmount = Math.min(debtors[i].amount, creditors[j].amount);
            suggestions.push({
                from: debtors[i].userId,
                to: creditors[j].userId,
                amount: Math.round(transferAmount * 100) / 100
            });
            debtors[i].amount -= transferAmount;
            creditors[j].amount -= transferAmount;
            if (debtors[i].amount < 0.01) i++;
            if (creditors[j].amount < 0.01) j++;
        }

        // 5. Enrich với thông tin user (tên, avatar)
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

        res.json({
            originalTransactions: shares.length,
            simplifiedTransactions: result.length,
            suggestions: result
        });
    } catch (error) {
        console.error('Debt simplification error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
