
export const calculateDebts = (transactions, members) => {
    // 1. Calculate Net Balance for each member
    // Balance > 0: Creditor (paid more than share)
    // Balance < 0: Debtor (paid less than share)
    const balances = {};
    members.forEach(m => balances[m.id] = 0);

    transactions.forEach(t => {
        if (!t.shares || t.shares.length === 0) return;

        // Payer gets + CREDIT
        // Note: transaction amount is what payer paid.
        balances[t.user_id] += t.amount;

        // Consumer gets - DEBIT
        t.shares.forEach(share => {
            balances[share.user_id] -= share.amount;
        });
    });

    // 2. Separate into Debtors and Creditors
    let debtors = [];
    let creditors = [];

    Object.keys(balances).forEach(id => {
        const amount = balances[id];
        if (amount < -1) debtors.push({ id, amount }); // Tolerance for float errors
        else if (amount > 1) creditors.push({ id, amount });
    });

    // 3. Greedy Algorithm
    // Sort by magnitude to match biggest debtor with biggest creditor first (Min-cash flow)
    const settlements = [];

    // Assuming we want to sort to handle largest amounts first
    debtors.sort((a, b) => a.amount - b.amount); // Ascending (most negative first)
    creditors.sort((a, b) => b.amount - a.amount); // Descending (most positive first)

    let i = 0; // debtor index
    let j = 0; // creditor index

    while (i < debtors.length && j < creditors.length) {
        let debtor = debtors[i];
        let creditor = creditors[j];

        // The amount to settle is the minimum of what debtor owes and what creditor is owed
        let amount = Math.min(Math.abs(debtor.amount), creditor.amount);

        // Push settlement
        settlements.push({
            from: debtor.id,
            to: creditor.id,
            amount: amount
        });

        // Update balances
        debtor.amount += amount;
        creditor.amount -= amount;

        // If debtor is settled (approx 0), move to next
        if (Math.abs(debtor.amount) < 1) {
            i++;
        }

        // If creditor is settled (approx 0), move to next
        if (creditor.amount < 1) {
            j++;
        }
    }

    return { balances, settlements };
};
