
import { createTransaction } from "@/features/transactions/transactionSlice"
import { editRecurring } from "@/features/recurring/recurringSlice"


export const getNextDueDate = (date, frequency) => {
    const next = new Date(date)
    switch (frequency) {
        case 'DAILY':
            next.setDate(next.getDate() + 1)
            break
        case 'WEEKLY':
            next.setDate(next.getDate() + 7)
            break
        case 'MONTHLY':
            next.setMonth(next.getMonth() + 1)
            break
        case 'YEARLY':
            next.setFullYear(next.getFullYear() + 1)
            break
        default:
            break
    }
    return next
}

export const runRecurringEngine = (store) => {
    const state = store.getState()
    const { rules } = state.recurring
    const today = new Date()

    let newTransactionsCount = 0

    rules.forEach(rule => {
        if (!rule.active) return

        let nextDue = new Date(rule.nextDueDate)

        // While the due date is in the past or today
        while (nextDue <= today) {
            // 1. Create the Transaction
            const transaction = {
                id: `rec-${rule.id}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                date: nextDue.toISOString(),
                amount: rule.amount,
                type: rule.type,
                category_id: rule.categoryId,
                wallet_id: rule.walletId,
                description: `[Recurring] ${rule.name}`,
                created_at: new Date().toISOString()
            }

            // 2. Dispatch Actions
            // Sử dụng thunk của Redux để gọi API
            // (Thunk sẽ trả về promise, nhưng process rule loop này có thể chạy ko await nếu ko cần strict order)
            store.dispatch(createTransaction(transaction)).catch(err => console.error(err));

            newTransactionsCount++

            // 3. Calculate Next Date
            nextDue = getNextDueDate(nextDue, rule.frequency)
            // Update rule nextDueDate
            store.dispatch(editRecurring({ id: rule.id, data: { nextDueDate: nextDue.toISOString() } }));
        }
    })

    if (newTransactionsCount > 0) {
        console.log(`Recurring Engine: Generated ${newTransactionsCount} transactions.`)
    }
    return newTransactionsCount
}
