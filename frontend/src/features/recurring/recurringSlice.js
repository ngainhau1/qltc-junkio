import { createSlice } from "@reduxjs/toolkit"

/*
    Rule Structure:
    {
        id: string,
        name: string,
        amount: number,
        type: 'EXPENSE' | 'INCOME',
        frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY',
        startDate: ISOString,
        nextDueDate: ISOString,
        walletId: string,
        categoryId: string,
        active: boolean
    }
*/

const initialState = {
    rules: []
}

const recurringSlice = createSlice({
    name: 'recurring',
    initialState,
    reducers: {
        addRule: (state, action) => {
            state.rules.push(action.payload)
        },
        updateRuleNextDueDate: (state, action) => {
            const { ruleId, nextDate } = action.payload
            const rule = state.rules.find(r => r.id === ruleId)
            if (rule) {
                rule.nextDueDate = nextDate
            }
        },
        toggleRule: (state, action) => {
            const rule = state.rules.find(r => r.id === action.payload)
            if (rule) {
                rule.active = !rule.active
            }
        },
        deleteRule: (state, action) => {
            state.rules = state.rules.filter(r => r.id !== action.payload)
        }
    }
})

export const { addRule, updateRuleNextDueDate, toggleRule, deleteRule } = recurringSlice.actions
export default recurringSlice.reducer
