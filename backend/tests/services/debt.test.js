const { simplifyDebts } = require('../../services/debtService');

describe('Algorithms: Debt Simplification using Greedy & Bipartite matching', () => {
    test('Case 1: Simple cycle (A owes B, B owes C, C owes A)', () => {
        const debts = [
            { debtor: 'A', creditor: 'B', amount: 100 },
            { debtor: 'B', creditor: 'C', amount: 100 },
            { debtor: 'C', creditor: 'A', amount: 100 }
        ];

        const result = simplifyDebts(debts);
        expect(result.length).toBe(0);
    });

    test('Case 2: Star network (A owes B, C owes B, D owes B)', () => {
        const debts = [
            { debtor: 'A', creditor: 'B', amount: 50 },
            { debtor: 'C', creditor: 'B', amount: 30 },
            { debtor: 'D', creditor: 'B', amount: 20 }
        ];

        const result = simplifyDebts(debts);
        expect(result.length).toBe(3);
        const totalAmountSettle = result.reduce((sum, r) => sum + r.amount, 0);
        expect(totalAmountSettle).toBe(100);
    });

    test('Case 3: Unbalanced chain (A owes B 100, B owes C 50)', () => {
        const debts = [
            { debtor: 'A', creditor: 'B', amount: 100 },
            { debtor: 'B', creditor: 'C', amount: 50 }
        ];

        const result = simplifyDebts(debts);
        expect(result.length).toBe(2);

        const aToB = result.find(t => t.from === 'A' && t.to === 'B');
        const aToC = result.find(t => t.from === 'A' && t.to === 'C');

        expect(aToB.amount).toBe(50);
        expect(aToC.amount).toBe(50);
    });

    test('Case 4: Negative/Zero input resilience', () => {
        const debts = [
            { debtor: 'A', creditor: 'B', amount: 0 },
            { debtor: 'C', creditor: 'D', amount: -50 }
        ];

        const result = simplifyDebts(debts);
        expect(result.length).toBe(1);
        expect(result[0].from).toBe('D');
        expect(result[0].to).toBe('C');
        expect(result[0].amount).toBe(50);
    });
});
