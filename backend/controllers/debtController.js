const {
    TransactionShare,
    Transaction,
    Wallet,
    User,
    Family,
    FamilyMember,
    sequelize,
    Notification
} = require('../models');
const { success, error: sendError, serverError } = require('../utils/responseHelper');
const { serializeNotification } = require('../utils/notificationPresenter');

const SETTLEMENT_EPSILON = 0.01;

const toMoney = (value) => Math.round((parseFloat(value) || 0) * 100) / 100;

const getShareDebt = (share) => ({
    share,
    debtor: share.user_id,
    creditor: share.Transaction.user_id,
    creditorWalletId: share.Transaction.wallet_id,
    amount: toMoney(share.amount)
});

const getUserDisplayName = async (userId) => {
    const user = await User.findByPk(userId, { attributes: ['id', 'name'] });
    return user?.name || userId;
};

const findSettlementPath = (debts, fromUserId, toUserId, toWalletId = null) => {
    const queue = [{ userId: fromUserId, path: [] }];
    const visited = new Set([fromUserId]);

    while (queue.length > 0) {
        const current = queue.shift();
        const outgoing = debts.filter((debt) => (
            debt.debtor === current.userId &&
            debt.amount > SETTLEMENT_EPSILON
        ));

        for (const debt of outgoing) {
            const path = [...current.path, debt];

            if (debt.creditor === toUserId && (!toWalletId || debt.creditorWalletId === toWalletId)) {
                return path;
            }

            if (!visited.has(debt.creditor)) {
                visited.add(debt.creditor);
                queue.push({ userId: debt.creditor, path });
            }
        }
    }

    return null;
};

const buildPathSettlementPlan = (shares, fromUserId, toUserId, amount, toWalletId = null) => {
    const debts = shares.map(getShareDebt);
    const reductions = new Map();
    const creditAllocations = new Map();
    let remainingAmount = toMoney(amount);

    while (remainingAmount > SETTLEMENT_EPSILON) {
        const path = findSettlementPath(debts, fromUserId, toUserId, toWalletId);

        if (!path) {
            return {
                reductions,
                creditAllocations,
                exceeded: reductions.size > 0
            };
        }

        const pathCapacity = Math.min(...path.map((debt) => debt.amount));
        const settledAmount = Math.min(remainingAmount, pathCapacity);
        const terminalDebt = path[path.length - 1];

        for (const debt of path) {
            debt.amount = toMoney(debt.amount - settledAmount);
            reductions.set(
                debt.share.id,
                toMoney((reductions.get(debt.share.id) || 0) + settledAmount)
            );
        }

        creditAllocations.set(
            terminalDebt.creditorWalletId,
            toMoney((creditAllocations.get(terminalDebt.creditorWalletId) || 0) + settledAmount)
        );

        remainingAmount = toMoney(remainingAmount - settledAmount);
    }

    return {
        reductions,
        creditAllocations,
        exceeded: false
    };
};

const applyShareReductions = async (shares, reductions, transaction) => {
    for (const share of shares) {
        const paidAmount = reductions.get(share.id) || 0;
        if (paidAmount <= SETTLEMENT_EPSILON) continue;

        const remainingAmount = toMoney(parseFloat(share.amount) - paidAmount);
        if (remainingAmount <= SETTLEMENT_EPSILON) {
            share.status = 'PAID';
        } else {
            share.amount = remainingAmount;
        }

        await share.save({ transaction });
    }
};

// POST /api/debts/settle
// Body: { to_user_id, amount, from_wallet_id, to_wallet_id?, family_id? }
exports.settleDebt = async (req, res) => {
    const { to_user_id, amount, from_wallet_id, to_wallet_id, family_id, from_user_id } = req.body;
    const payerUserId = req.user.id;
    const parsedAmount = toMoney(amount);

    if (from_user_id && from_user_id !== payerUserId) {
        return sendError(res, 'INVALID_SETTLEMENT_USERS', 400);
    }

    if (!parsedAmount || parsedAmount <= 0) {
        return sendError(res, 'INVALID_AMOUNT', 400);
    }

    if (!to_user_id || payerUserId === to_user_id) {
        return sendError(res, 'INVALID_SETTLEMENT_USERS', 400);
    }

    const t = await sequelize.transaction();
    try {
        const fromWallet = await Wallet.findByPk(from_wallet_id, { transaction: t });
        const requestedToWallet = to_wallet_id
            ? (from_wallet_id === to_wallet_id
                ? fromWallet
                : await Wallet.findByPk(to_wallet_id, { transaction: t }))
            : null;

        if (!fromWallet) {
            await t.rollback();
            return sendError(res, 'WALLET_NOT_FOUND', 404);
        }

        if (family_id) {
            const family = await Family.findByPk(family_id, { transaction: t });
            if (!family) {
                await t.rollback();
                return sendError(res, 'FAMILY_NOT_FOUND', 404);
            }

            const membership = FamilyMember
                ? await FamilyMember.findOne({
                    where: { family_id, user_id: payerUserId },
                    transaction: t
                })
                : null;
            if (family.owner_id !== payerUserId && !membership) {
                await t.rollback();
                return sendError(res, 'FORBIDDEN_FAMILY_SETTLEMENT', 403);
            }

            if (fromWallet.user_id !== payerUserId || fromWallet.family_id) {
                await t.rollback();
                return sendError(res, 'WALLET_NOT_FOUND', 404);
            }
        } else if (
            fromWallet.user_id !== payerUserId ||
            !requestedToWallet ||
            requestedToWallet.user_id !== to_user_id ||
            fromWallet.family_id ||
            requestedToWallet.family_id
        ) {
            await t.rollback();
            return sendError(res, 'WALLET_NOT_FOUND', 404);
        }

        if (parseFloat(fromWallet.balance) < parsedAmount) {
            await t.rollback();
            return sendError(res, 'INSUFFICIENT_BALANCE', 400);
        }

        const transactionWhere = family_id
            ? { family_id }
            : { user_id: to_user_id };

        const unpaidShares = await TransactionShare.findAll({
            where: {
                status: 'UNPAID',
                approval_status: 'APPROVED'
            },
            include: [{
                model: Transaction,
                as: 'Transaction',
                required: true,
                where: transactionWhere
            }],
            transaction: t
        });

        const plan = buildPathSettlementPlan(
            unpaidShares,
            payerUserId,
            to_user_id,
            parsedAmount,
            family_id ? null : to_wallet_id
        );

        if (!plan || plan.reductions.size === 0) {
            await t.rollback();
            return sendError(res, 'NO_PAYABLE_DEBT_FOUND', 409);
        }

        if (plan.exceeded) {
            await t.rollback();
            return sendError(res, 'SETTLEMENT_AMOUNT_EXCEEDS_DEBT', 400);
        }

        let creditTargets = [];
        if (family_id) {
            const allocationEntries = Array.from(plan.creditAllocations.entries())
                .filter(([, value]) => value > SETTLEMENT_EPSILON);
            const recipientWalletIds = allocationEntries.map(([walletId]) => walletId);
            const recipientWallets = await Wallet.findAll({
                where: {
                    id: recipientWalletIds,
                    user_id: to_user_id,
                    family_id: null
                },
                transaction: t
            });
            const walletById = new Map(recipientWallets.map((wallet) => [wallet.id, wallet]));

            if (recipientWalletIds.length === 0 || recipientWallets.length !== recipientWalletIds.length) {
                await t.rollback();
                return sendError(res, 'WALLET_NOT_FOUND', 404);
            }

            creditTargets = allocationEntries.map(([walletId, value]) => ({
                wallet: walletById.get(walletId),
                amount: value
            }));
        } else {
            creditTargets = [{
                wallet: requestedToWallet,
                amount: parsedAmount
            }];
        }

        fromWallet.balance = toMoney(parseFloat(fromWallet.balance) - parsedAmount);
        await fromWallet.save({ transaction: t });

        for (const target of creditTargets) {
            target.wallet.balance = toMoney(parseFloat(target.wallet.balance) + target.amount);
            await target.wallet.save({ transaction: t });
        }

        const [payerName, recipientName] = await Promise.all([
            getUserDisplayName(payerUserId),
            getUserDisplayName(to_user_id)
        ]);

        await Transaction.create({
            amount: parsedAmount,
            date: new Date(),
            description: `Trả nợ cho ${recipientName}`,
            type: 'TRANSFER_OUT',
            wallet_id: from_wallet_id,
            user_id: payerUserId,
            family_id: family_id || fromWallet.family_id || null
        }, { transaction: t });

        for (const target of creditTargets) {
            await Transaction.create({
                amount: target.amount,
                date: new Date(),
                description: `Nhận tiền trả nợ từ ${payerName}`,
                type: 'TRANSFER_IN',
                wallet_id: target.wallet.id,
                user_id: to_user_id,
                family_id: family_id || target.wallet.family_id || null
            }, { transaction: t });
        }
        await applyShareReductions(unpaidShares, plan.reductions, t);

        await t.commit();

        try {
            if (Notification) {
                const fromUser = await User.findByPk(payerUserId);
                const fromUserName = fromUser ? fromUser.name : 'Nguoi dung khong xac dinh';

                const payload = JSON.stringify({
                    key: 'notifications.debtSettledMsg',
                    params: { amount: parsedAmount.toString(), from: fromUserName }
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

        return success(res, null, 'DEBT_SETTLED');

    } catch (err) {
        if (!t.finished) {
            await t.rollback();
        }
        console.error(err);
        return serverError(res, 'SETTLE_DEBT_FAILED');
    }
};

// GET /api/debts/simplified/:familyId
// Thuật toán Tham lam (Greedy) tối ưu hóa mạng lưới nợ trong gia đình
exports.getSimplifiedDebts = async (req, res) => {
    try {
        const { familyId } = req.params;

        const family = await Family.findByPk(familyId);
        if (!family) {
            return sendError(res, 'FAMILY_NOT_FOUND', 404);
        }

        const membership = await FamilyMember.findOne({
            where: { family_id: familyId, user_id: req.user.id }
        });
        if (family.owner_id !== req.user.id && !membership) {
            return sendError(res, 'FORBIDDEN_FAMILY_SETTLEMENT', 403);
        }

        // 1. Lấy tất cả TransactionShare UNPAID + APPROVED trong family
        const shares = await TransactionShare.findAll({
            where: {
                status: 'UNPAID',
                approval_status: 'APPROVED'
            },
            include: [{
                model: Transaction,
                as: 'Transaction',
                required: true,
                where: { family_id: familyId }
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
        }, 'DEBTS_SIMPLIFIED');
    } catch (err) {
        console.error('Debt simplification error:', err);
        serverError(res, 'DEBT_SIMPLIFICATION_FAILED');
    }
};
