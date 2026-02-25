import { createSlice } from '@reduxjs/toolkit';

// Generate some initial mock goals
const generateMockGoals = () => {
    return [
        {
            id: 'goal-1',
            name: 'Mua Macbook Pro',
            targetAmount: 50000000, // 50 million
            currentAmount: 20000000, // 20 million
            deadline: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString(), // 6 months from now
            status: 'IN_PROGRESS',
            colorCode: '#3b82f6', // blue-500
            imageUrl: 'Laptop' // Lucide icon name or URL
        },
        {
            id: 'goal-2',
            name: 'Du Lịch Quỹ Tự Do',
            targetAmount: 20000000,
            currentAmount: 8500000,
            deadline: new Date(new Date().setMonth(new Date().getMonth() + 2)).toISOString(),
            status: 'IN_PROGRESS',
            colorCode: '#10b981', // emerald-500
            imageUrl: 'Plane'
        },
        {
            id: 'goal-3',
            name: 'Quỹ Dự Phòng Khẩn Cấp',
            targetAmount: 100000000,
            currentAmount: 100000000,
            deadline: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString(),
            status: 'ACHIEVED',
            colorCode: '#f59e0b', // amber-500
            imageUrl: 'ShieldCheck'
        }
    ];
};

const initialState = {
    items: generateMockGoals(),
};

const goalsSlice = createSlice({
    name: 'goals',
    initialState,
    reducers: {
        addGoal: (state, action) => {
            state.items.unshift({
                ...action.payload,
                id: `goal-${Date.now()}`,
                status: 'IN_PROGRESS',
                currentAmount: 0
            });
        },
        updateGoal: (state, action) => {
            const index = state.items.findIndex(g => g.id === action.payload.id);
            if (index !== -1) {
                state.items[index] = { ...state.items[index], ...action.payload };
            }
        },
        deleteGoal: (state, action) => {
            state.items = state.items.filter(g => g.id !== action.payload);
        },
        depositToGoal: (state, action) => {
            // payload: { id, amount }
            const goal = state.items.find(g => g.id === action.payload.id);
            if (goal) {
                goal.currentAmount += Number(action.payload.amount);
                if (goal.currentAmount >= goal.targetAmount) {
                    goal.status = 'ACHIEVED';
                }
            }
        },
    }
});

export const { addGoal, updateGoal, deleteGoal, depositToGoal } = goalsSlice.actions;

export default goalsSlice.reducer;
