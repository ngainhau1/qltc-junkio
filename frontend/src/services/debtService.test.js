
import { describe, it, expect } from 'vitest';
import { calculateDebts } from './debtService';

describe('debtService - Greedy Algorithm', () => {
    // Scenario 1: Simple 1-to-1 Debt
    // Alice pays 100 for Dinner. Shared by Alice and Bob.
    // Logic: Alice paid 100. Global cost 100.
    // Splits: Alice consumes 50, Bob consumes 50.
    // Net: Alice (+50), Bob (-50). Bob owes Alice 50.
    it('should calculate simple debt correctly', () => {
        const transactions = [{
            id: 't1',
            amount: 100, // Amount Payer Paid
            user_id: 'alice', // Payer
            shares: [
                { user_id: 'alice', amount: 50 },
                { user_id: 'bob', amount: 50 }
            ]
        }];
        const members = [{ id: 'alice' }, { id: 'bob' }];

        const result = calculateDebts(transactions, members);

        expect(result.settlements).toHaveLength(1);
        expect(result.settlements[0]).toEqual({
            from: 'bob',
            to: 'alice',
            amount: 50
        });
    });

    // Scenario 2: Circular Debt (A->B->C->A) - Should simplify
    // A lends B 10. B lends C 10. C lends A 10.
    // Everyone paid 10, consumed 10. Net Balance 0. No settlements needed.
    it('should simplify circular debt to zero', () => {
        // A pays for B (A +10, B -10)
        // B pays for C (B +10, C -10)
        // C pays for A (C +10, A -10)
        const transactions = [
            { id: 't1', amount: 10, user_id: 'A', shares: [{ user_id: 'B', amount: 10 }] },
            { id: 't2', amount: 10, user_id: 'B', shares: [{ user_id: 'C', amount: 10 }] },
            { id: 't3', amount: 10, user_id: 'C', shares: [{ user_id: 'A', amount: 10 }] }
        ];
        const members = [{ id: 'A' }, { id: 'B' }, { id: 'C' }];

        const result = calculateDebts(transactions, members);

        // Expect no settlements because Balances are all 0
        expect(result.settlements).toHaveLength(0);
    });

    // Scenario 3: Multiple Creditors/Debtors
    // A pays 60 for (A,B,C) -> A+40, B-20, C-20
    it('should split debt among multiple debtors', () => {
        const transactions = [{
            id: 't1',
            amount: 60,
            user_id: 'A',
            shares: [
                { user_id: 'A', amount: 20 },
                { user_id: 'B', amount: 20 },
                { user_id: 'C', amount: 20 }
            ]
        }];
        const members = [{ id: 'A' }, { id: 'B' }, { id: 'C' }];

        const result = calculateDebts(transactions, members);

        // Sorting in Algo: Debtors: B(-20), C(-20). Creditor: A(+40).
        // B pays A 20. C pays A 20. Total 2 settlements.
        expect(result.settlements).toHaveLength(2);

        const totalSettled = result.settlements.reduce((sum, s) => sum + s.amount, 0);
        expect(totalSettled).toBe(40);
        expect(result.settlements[0].to).toBe('A');
    });
});
