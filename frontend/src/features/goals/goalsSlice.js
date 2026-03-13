import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/api';

const initialState = {
    goals: [],
    loading: false,
    error: null,
};

// --- Async Thunks ---
export const fetchGoals = createAsyncThunk(
    'goals/fetchGoals',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/goals');
            return response.data; // array of goals
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Lỗi tải mục tiêu');
        }
    }
);

export const createGoal = createAsyncThunk(
    'goals/createGoal',
    async (goalData, { rejectWithValue }) => {
        try {
            const response = await api.post('/goals', goalData);
            return response.data; // new goal obj
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Lỗi tạo mục tiêu');
        }
    }
);

export const editGoal = createAsyncThunk(
    'goals/editGoal',
    async ({ id, data }, { rejectWithValue }) => {
        try {
            const response = await api.put(`/goals/${id}`, data);
            return response.data; // updated goal
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Lỗi cập nhật mục tiêu');
        }
    }
);

export const removeGoal = createAsyncThunk(
    'goals/removeGoal',
    async (id, { rejectWithValue }) => {
        try {
            await api.delete(`/goals/${id}`);
            return id;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Lỗi xóa mục tiêu');
        }
    }
);

export const depositAmount = createAsyncThunk(
    'goals/depositAmount',
    async ({ id, amount, wallet_id }, { rejectWithValue }) => {
        try {
            const response = await api.post(`/goals/${id}/deposit`, { amount, wallet_id });
            return response.data; // Assuming it returns the updated goal obj
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Lỗi nạp tiền');
        }
    }
);

const goalsSlice = createSlice({
    name: 'goals',
    initialState,
    reducers: {
        // Local Optimistic updates can be kept if needed.
        updateGoalProgressLocal: (state, action) => {
            const { id, amount } = action.payload;
            const goal = state.goals.find(g => g.id === id);
            if (goal) {
                goal.currentAmount = Number(goal.currentAmount) + Number(amount);
                if (goal.currentAmount >= goal.targetAmount) {
                    goal.status = 'ACHIEVED';
                }
            }
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch Goals
            .addCase(fetchGoals.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchGoals.fulfilled, (state, action) => {
                state.loading = false;
                state.goals = action.payload;
            })
            .addCase(fetchGoals.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Create
            .addCase(createGoal.pending, (state) => {
                state.loading = true;
            })
            .addCase(createGoal.fulfilled, (state, action) => {
                state.loading = false;
                state.goals.unshift(action.payload);
            })
            .addCase(createGoal.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Edit
            .addCase(editGoal.fulfilled, (state, action) => {
                const index = state.goals.findIndex(g => g.id === action.payload.id);
                if (index !== -1) {
                    state.goals[index] = action.payload;
                }
            })

            // Remove
            .addCase(removeGoal.fulfilled, (state, action) => {
                state.goals = state.goals.filter(g => g.id !== action.payload);
            })

            // Deposit
            .addCase(depositAmount.fulfilled, (state, action) => {
                const index = state.goals.findIndex(g => g.id === action.payload.id);
                if (index !== -1) {
                    state.goals[index] = action.payload;
                }
            });
    },
});

export const { updateGoalProgressLocal } = goalsSlice.actions;
export default goalsSlice.reducer;
