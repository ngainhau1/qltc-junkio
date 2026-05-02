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
const {
    SETTLEMENT_EPSILON,
    toMoney,
    simplifyDebts,
    buildPathSettlementPlan
} = require('../services/debtService');

const getUserDisplayName = async (userId) => {
    const user = await User.findByPk(userId, { attributes: ['id', 'name'] });
    return user?.name || userId;
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
                const fromUserName = fromUser ? fromUser.name : payerUserId;

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

        const mappedDebts = shares.map(share => ({
            debtor: share.user_id,
            creditor: share.Transaction.user_id,
            amount: toMoney(share.amount)
        }));

        const suggestions = simplifyDebts(mappedDebts);
        const walletIds = [...new Set(
            shares
                .map((share) => share.Transaction?.wallet_id)
                .filter(Boolean)
        )];
        const wallets = walletIds.length > 0
            ? await Wallet.findAll({
                where: { id: walletIds },
                attributes: ['id', 'user_id', 'family_id']
            })
            : [];
        const walletById = new Map(wallets.map((wallet) => [wallet.id, wallet]));
        const settleableSuggestions = suggestions
            .map((suggestion) => {
                const plan = buildPathSettlementPlan(
                    shares,
                    suggestion.from,
                    suggestion.to,
                    suggestion.amount
                );
                const allocationEntries = Array.from(plan.creditAllocations.entries())
                    .filter(([, value]) => value > SETTLEMENT_EPSILON);

                const allAllocationsArePersonalRecipientWallets = allocationEntries.length > 0 &&
                    allocationEntries.every(([walletId]) => {
                        const wallet = walletById.get(walletId);
                        return wallet &&
                            String(wallet.user_id) === String(suggestion.to) &&
                            !wallet.family_id;
                    });

                if (
                    plan.reductions.size === 0 ||
                    plan.settledAmount <= SETTLEMENT_EPSILON ||
                    !allAllocationsArePersonalRecipientWallets
                ) {
                    return null;
                }

                return {
                    ...suggestion,
                    amount: toMoney(plan.settledAmount)
                };
            })
            .filter(Boolean);

        const userIds = [...new Set(settleableSuggestions.flatMap(s => [s.from, s.to]))];
        const users = userIds.length > 0
            ? await User.findAll({
                where: { id: userIds },
                attributes: ['id', 'name', 'avatar']
            })
            : [];
        const userMap = Object.fromEntries(users.map(u => [u.id, { id: u.id, name: u.name, avatar: u.avatar }]));

        const result = settleableSuggestions.map(s => ({
            from: userMap[s.from] || { id: s.from, name: s.from },
            to: userMap[s.to] || { id: s.to, name: s.to },
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
