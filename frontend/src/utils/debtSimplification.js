/**
 * Cải tiến thuật toán Đơn giản hóa nợ.
 * Thay vì Greedy cơ bản luôn bốc thằng nợ nhiều nhất trả cho thằng cho vay nhiều nhất (dễ sinh ra giao dịch chéo vô cớ),
 * thuật toán cải tiến này ưu tiên "Exact Matches" (khớp lệnh chính xác) trước, sau đó mới đến Greedy.
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

        balances[payer] = (balances[payer] || 0) + amount;

        if (t.shares && t.shares.length > 0) {
            // Lọc các share đã được APPROVED
            const approvedShares = t.shares.filter(s => s.approval_status === 'APPROVED');

            if (approvedShares.length > 0) {
                approvedShares.forEach(share => {
                    balances[share.user_id] = (balances[share.user_id] || 0) - share.amount;
                });
            } else {
                // Nếu chưa có ai APPROVED, thuật toán có thể tạm thời coi khoản chi đó do người tạo tự chịu
                // Hoặc đơn giản là không gán nợ cho ai cả.
                // Để đơn giản, ta sẽ chia đều theo logic cũ nếu KHÔNG CÓ shares nào được approved, 
                // nhưng nếu bám sát thực tế, việc chưa phê duyệt có nghĩa là nợ chưa chốt hạ.
                // Phương pháp an toàn nhất: Ta không tính các khoản này.
                // Do nothing. Payer paid, but no one accepted debt yet.
            }
        } else {
            const splitCount = t.splitAmong.length;
            const splitAmount = amount / splitCount;

            t.splitAmong.forEach(memberId => {
                balances[memberId] = (balances[memberId] || 0) - splitAmount;
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

    // Bước 2: Ưu tiên Khớp Lệnh Chính Xác (Exact Match)
    // Nếu A nợ đúng 50k, và B được nhận đúng 50k -> Bắt cặp luôn để loại bỏ khoir mảng
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

    // Lọc lại mảng bỏ những người đã được thanh toán
    const activeDebtors = debtors.filter(d => d.amount > 0.01);
    const activeCreditors = creditors.filter(c => c.amount > 0.01);

    // Bước 3: Thuật toán tham lam (Greedy) có nắn chỉnh
    // Ưu tiên sắp xếp để thanh toán các khoản lớn nhất với nhau
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

export function calculateTotalFlow(settlements) {
    return settlements.reduce((acc, s) => acc + s.amount, 0);
}
