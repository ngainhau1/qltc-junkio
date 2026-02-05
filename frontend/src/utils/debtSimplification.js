/**
 * Minimizes the number of transactions required to settle debts within a group.
 * Uses a greedy algorithm approach:
 * 1. Calculate net balance for each person.
 * 2. Separate into debtors (owe money) and creditors (owed money).
 * 3. Match the biggest debtor with the biggest creditor to settle amounts.
 * 
 * @param {Array} transactions - List of expenses { paidBy: userId, splitAmong: [userIds], amount: number }
 * @returns {Array} - Optimized transactions { from: userId, to: userId, amount: number }
 */
export function simplifyDebts(transactions) {
    const balances = {};

    // 1. Calculate Net Balances
    transactions.forEach(t => {
        const payer = t.paidBy;
        const amount = t.amount;
        const splitCount = t.splitAmong.length;
        const splitAmount = amount / splitCount;

        // Payer gets back the full amount (conceptually)
        // Check if payer is also in splitAmong? usually yes. 
        // Logic: Payer paid X. Everyone in splitAmong owes Payer X/N.
        // Net change for Payer = +X - (X/N if included)
        // Net change for Splitter = -X/N

        // Simpler mental model:
        // Payer is +Amount
        balances[payer] = (balances[payer] || 0) + amount;

        // Each person in split (including payer if applicable) pays their share
        t.splitAmong.forEach(memberId => {
            balances[memberId] = (balances[memberId] || 0) - splitAmount;
        });
    });

    // 2. Separate into Debtors and Creditors
    const debtors = [];
    const creditors = [];

    Object.keys(balances).forEach(person => {
        const balance = balances[person];
        // Floating point correction
        if (Math.abs(balance) < 0.01) return;

        if (balance > 0) {
            creditors.push({ person, amount: balance });
        } else {
            debtors.push({ person, amount: -balance }); // Store positive debt
        }
    });

    // 3. Greedy Matching
    const settlements = [];
    let i = 0; // debtors index
    let j = 0; // creditors index

    while (i < debtors.length && j < creditors.length) {
        const debtor = debtors[i];
        const creditor = creditors[j];

        // The amount to settle is logical min of what debtor owes and creditor is owed
        const amount = Math.min(debtor.amount, creditor.amount);

        settlements.push({
            from: debtor.person,
            to: creditor.person,
            amount: Number(amount.toFixed(2))
        });

        // Adjust remaining amounts
        debtor.amount -= amount;
        creditor.amount -= amount;

        // Move pointers if settled
        if (debtor.amount < 0.01) i++;
        if (creditor.amount < 0.01) j++;
    }

    return settlements;
}

// Helper to calculate total flow just for comparison
export function calculateTotalFlow(settlements) {
    return settlements.reduce((acc, s) => acc + s.amount, 0);
}
