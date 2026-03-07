// Mô phỏng hàm debtSimplification.js của Frontend
function simplifyDebts(transactions) {
    const balances = {};

    transactions.forEach(t => {
        const payer = t.paidBy;
        const amount = t.amount;

        balances[payer] = (balances[payer] || 0) + amount;

        if (t.shares && t.shares.length > 0) {
            t.shares.forEach(share => {
                const shareAmount = share.amount;
                if (share.approval_status === 'APPROVED') {
                    balances[share.user_id] = (balances[share.user_id] || 0) - shareAmount;
                } else {
                    balances[payer] = (balances[payer] || 0) - shareAmount;
                }
            });
        }
    });

    const debtors = [];
    const creditors = [];

    Object.keys(balances).forEach(person => {
        const balance = balances[person];
        if (Math.abs(balance) < 0.01) return;

        if (balance > 0) {
            creditors.push({ person, amount: balance });
        } else {
            debtors.push({ person, amount: -balance });
        }
    });

    const settlements = [];

    // Exact Match
    for (let i = 0; i < debtors.length; i++) {
        for (let j = 0; j < creditors.length; j++) {
            if (debtors[i].amount > 0 && creditors[j].amount > 0 &&
                Math.abs(debtors[i].amount - creditors[j].amount) < 0.01) {

                settlements.push({
                    from: debtors[i].person,
                    to: creditors[j].person,
                    amount: Number(debtors[i].amount.toFixed(2))
                });

                debtors[i].amount = 0;
                creditors[j].amount = 0;
            }
        }
    }

    const activeDebtors = debtors.filter(d => d.amount > 0.01);
    const activeCreditors = creditors.filter(c => c.amount > 0.01);

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
            amount: Number(amount.toFixed(2))
        });

        debtor.amount -= amount;
        creditor.amount -= amount;

        if (debtor.amount < 0.01) i++;
        if (creditor.amount < 0.01) j++;
    }

    return settlements;
}

// Data giả lập
const mockTransactions = [
    {
        // A trả 100k cho cả nhóm
        paidBy: 'A',
        amount: 100,
        shares: [
            { user_id: 'A', amount: 50, approval_status: 'APPROVED' },
            { user_id: 'B', amount: 50, approval_status: 'PENDING' } // B chưa duyệt nợ
        ]
    },
    {
        // B trả 100k, C nợ B 100k
        paidBy: 'B',
        amount: 100,
        shares: [
            { user_id: 'C', amount: 100, approval_status: 'APPROVED' } // C đã duyệt
        ]
    },
    {
        // C trả 50k, A nợ C 50k (bị từ chối)
        paidBy: 'C',
        amount: 50,
        shares: [
            { user_id: 'A', amount: 50, approval_status: 'REJECTED' } // A từ chối
        ]
    }
];

console.log("=== KẾT QUẢ TEST LOGIC ĐƠN GIẢN HÓA NỢ V2 ===");
console.log("Dữ liệu đầu vào: 3 giao dịch (chỉ có 1 khoản nợ của C được duyệt, còn lại bị bơ).");

const results = simplifyDebts(mockTransactions);
console.log("\nCác giao dịch thanh toán ròng (Settlements) cần thực hiện:");
console.log(JSON.stringify(results, null, 2));

