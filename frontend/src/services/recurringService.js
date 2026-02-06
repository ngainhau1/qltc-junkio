
import { addTransaction } from "@/features/transactions/transactionSlice"
import { updateRuleNextDueDate } from "@/features/recurring/recurringSlice"
import { decreaseBalance, increaseBalance } from "@/features/wallets/walletSlice"

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
            store.dispatch(addTransaction(transaction))

            // Update Wallet Balance
            if (rule.type === 'EXPENSE') {
                store.dispatch(decreaseBalance({ id: rule.walletId, amount: rule.amount }))
            } else {
                store.dispatch(increaseBalance({ id: rule.walletId, amount: rule.amount }))
            }

            newTransactionsCount++

            // 3. Calculate Next Date
            nextDue = getNextDueDate(nextDue, rule.frequency)
            store.dispatch(updateRuleNextDueDate({
                ruleId: rule.id,
                nextDate: nextDue.toISOString()
            }))
        }
    })

    if (newTransactionsCount > 0) {
        console.log(`Recurring Engine: Generated ${newTransactionsCount} transactions.`)
    }
    return newTransactionsCount
}
