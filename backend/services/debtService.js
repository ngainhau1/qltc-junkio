/**
 * Debt Simplification Algorithm using Greedy Matching on a Bipartite format
 * Purpose: Minimizes the total number of transactions required to settle all debts inside a group/family.
 */

// Complexity: O(N log N) dominated by sorting the balances
const simplifyDebts = (debts) => {
    // 1. Calculate the Net Balance for every person
    // Balance < 0 : They owe money (Debtor)
    // Balance > 0 : They are owed money (Creditor)
    const balances = {};
    for (const debt of debts) {
        const debtor = debt.debtor;
        const creditor = debt.creditor;
        const amount = parseFloat(debt.amount);

        balances[debtor] = (balances[debtor] || 0) - amount;
        balances[creditor] = (balances[creditor] || 0) + amount;
    }

    // 2. Separate into arrays based on net position
    const debtors = [];
    const creditors = [];
    for (const [userId, balance] of Object.entries(balances)) {
        if (balance < -0.01) debtors.push({ userId, amount: Math.abs(balance) });
        else if (balance > 0.01) creditors.push({ userId, amount: balance });
    }

    // 3. Sort arrays descending so largest debts are matched with largest credits (Greedy Approach)
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    // 4. Greedy Matching Algorithm
    const simplifiedTransactions = [];
    let i = 0, j = 0;
    
    while (i < debtors.length && j < creditors.length) {
        // Find the maximum amount we can settle between the current debtor and creditor
        const transferAmount = Math.min(debtors[i].amount, creditors[j].amount);
        
        simplifiedTransactions.push({
            from: debtors[i].userId,
            to: creditors[j].userId,
            amount: Math.round(transferAmount * 100) / 100
        });

        // Deduct the settled amount
        debtors[i].amount -= transferAmount;
        creditors[j].amount -= transferAmount;

        // Move the pointer if the balance is fully settled (epsilon to handle JS floating point drift)
        if (debtors[i].amount < 0.01) i++;
        if (creditors[j].amount < 0.01) j++;
    }

    return simplifiedTransactions;
};

module.exports = {
    simplifyDebts
};
