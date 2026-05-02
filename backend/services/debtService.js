const SETTLEMENT_EPSILON = 0.01;

const toMoney = (value) => Math.round((parseFloat(value) || 0) * 100) / 100;

const simplifyDebts = (debts) => {
    const balances = {};
    for (const debt of debts) {
        const debtor = debt.debtor;
        const creditor = debt.creditor;
        const amount = toMoney(debt.amount);

        balances[debtor] = (balances[debtor] || 0) - amount;
        balances[creditor] = (balances[creditor] || 0) + amount;
    }

    const debtors = [];
    const creditors = [];
    for (const [userId, balance] of Object.entries(balances)) {
        if (balance < -0.01) debtors.push({ userId, amount: Math.abs(balance) });
        else if (balance > 0.01) creditors.push({ userId, amount: balance });
    }

    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const simplifiedTransactions = [];
    let i = 0, j = 0;

    while (i < debtors.length && j < creditors.length) {
        const transferAmount = Math.min(debtors[i].amount, creditors[j].amount);

        simplifiedTransactions.push({
            from: debtors[i].userId,
            to: creditors[j].userId,
            amount: toMoney(transferAmount)
        });

        debtors[i].amount -= transferAmount;
        creditors[j].amount -= transferAmount;

        if (debtors[i].amount < 0.01) i++;
        if (creditors[j].amount < 0.01) j++;
    }

    return simplifiedTransactions;
};

const getShareDebt = (share) => {
    const transaction = share.Transaction || share.transaction;
    return {
        share,
        debtor: share.user_id,
        creditor: transaction.user_id,
        creditorWalletId: transaction.wallet_id,
        amount: toMoney(share.amount)
    };
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
                settledAmount: toMoney(amount - remainingAmount),
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
        settledAmount: toMoney(amount),
        exceeded: false
    };
};

module.exports = {
    SETTLEMENT_EPSILON,
    toMoney,
    simplifyDebts,
    buildPathSettlementPlan
};
