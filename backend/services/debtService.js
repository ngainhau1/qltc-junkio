const simplifyDebts = (debts) => {
    const balances = {};
    for (const debt of debts) {
        const debtor = debt.debtor;
        const creditor = debt.creditor;
        const amount = parseFloat(debt.amount);

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
            amount: Math.round(transferAmount * 100) / 100
        });

        debtors[i].amount -= transferAmount;
        creditors[j].amount -= transferAmount;

        if (debtors[i].amount < 0.01) i++;
        if (creditors[j].amount < 0.01) j++;
    }

    return simplifiedTransactions;
};

module.exports = {
    simplifyDebts
};
