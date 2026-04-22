export function simplifyDebts(transactions) {
    const balances = {};

    transactions.forEach((transaction) => {
        const payer = String(transaction.paidBy);
        const amount = parseFloat(transaction.amount) || 0;

        balances[payer] = (balances[payer] || 0) + amount;

        if (transaction.shares && transaction.shares.length > 0) {
            transaction.shares.forEach((share) => {
                const shareAmount = parseFloat(share.amount) || 0;

                if (share.status === 'PAID') {
                    balances[payer] = (balances[payer] || 0) - shareAmount;
                    return;
                }

                if (share.approval_status === 'APPROVED') {
                    balances[String(share.user_id)] = (balances[String(share.user_id)] || 0) - shareAmount;
                } else {
                    balances[payer] = (balances[payer] || 0) - shareAmount;
                }
            });
        } else if (transaction.splitAmong && transaction.splitAmong.length > 0) {
            const splitAmount = amount / transaction.splitAmong.length;

            transaction.splitAmong.forEach((memberId) => {
                balances[String(memberId)] = (balances[String(memberId)] || 0) - splitAmount;
            });
        }
    });

    const debtors = [];
    const creditors = [];

    Object.keys(balances).forEach((person) => {
        const balance = balances[person];
        if (Math.abs(balance) < 0.01) return;

        if (balance > 0) {
            creditors.push({ person, amount: balance });
        } else {
            debtors.push({ person, amount: -balance });
        }
    });

    const settlements = [];

    for (let i = 0; i < debtors.length; i++) {
        for (let j = 0; j < creditors.length; j++) {
            if (
                debtors[i].amount > 0 &&
                creditors[j].amount > 0 &&
                Math.abs(debtors[i].amount - creditors[j].amount) < 0.01
            ) {
                settlements.push({
                    from: debtors[i].person,
                    to: creditors[j].person,
                    amount: Number(debtors[i].amount.toFixed(2)),
                });

                debtors[i].amount = 0;
                creditors[j].amount = 0;
            }
        }
    }

    const activeDebtors = debtors.filter((debtor) => debtor.amount > 0.01);
    const activeCreditors = creditors.filter((creditor) => creditor.amount > 0.01);

    activeDebtors.sort((a, b) => b.amount - a.amount);
    activeCreditors.sort((a, b) => b.amount - a.amount);

    let i = 0;
    let j = 0;

    while (i < activeDebtors.length && j < activeCreditors.length) {
        const debtor = activeDebtors[i];
        const creditor = activeCreditors[j];
        const amount = Math.min(debtor.amount, creditor.amount);

        settlements.push({
            from: debtor.person,
            to: creditor.person,
            amount: Number(amount.toFixed(2)),
        });

        debtor.amount -= amount;
        creditor.amount -= amount;

        if (debtor.amount < 0.01) i++;
        if (creditor.amount < 0.01) j++;
    }

    return settlements;
}

export function calculateTotalFlow(settlements) {
    return settlements.reduce((acc, settlement) => acc + settlement.amount, 0);
}
