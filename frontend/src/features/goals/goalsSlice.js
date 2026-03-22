import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/api';
import { fetchWallets } from '@/features/wallets/walletSlice';

const initialState = {
    goals: [],
    loading: false,
    error: null,
};

export const fetchGoals = createAsyncThunk(
    'goals/fetchGoals',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/goals');
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Loi tai muc tieu');
        }
    }
);

export const createGoal = createAsyncThunk(
    'goals/createGoal',
    async (goalData, { rejectWithValue }) => {
        try {
            const response = await api.post('/goals', goalData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Loi tao muc tieu');
        }
    }
);

export const editGoal = createAsyncThunk(
    'goals/editGoal',
    async ({ id, data }, { rejectWithValue }) => {
        try {
            const response = await api.put(`/goals/${id}`, data);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Loi cap nhat muc tieu');
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
            return rejectWithValue(error.response?.data?.message || 'Loi xoa muc tieu');
        }
    }
);

export const depositAmount = createAsyncThunk(
    'goals/depositAmount',
    async ({ id, amount, wallet_id }, { dispatch, rejectWithValue }) => {
        try {
            const response = await api.post(`/goals/${id}/deposit`, { amount, wallet_id });
            dispatch(fetchWallets());
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Loi nap tien');
        }
    }
);

const goalsSlice = createSlice({
    name: 'goals',
    initialState,
    reducers: {
        updateGoalProgressLocal: (state, action) => {
            const { id, amount } = action.payload;
            const goal = state.goals.find((item) => item.id === id);
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
            .addCase(editGoal.fulfilled, (state, action) => {
                const index = state.goals.findIndex((goal) => goal.id === action.payload.id);
                if (index !== -1) {
                    state.goals[index] = action.payload;
                }
            })
            .addCase(removeGoal.fulfilled, (state, action) => {
                state.goals = state.goals.filter((goal) => goal.id !== action.payload);
            })
            .addCase(depositAmount.fulfilled, (state, action) => {
                const index = state.goals.findIndex((goal) => goal.id === action.payload.id);
                if (index !== -1) {
                    state.goals[index] = action.payload;
                }
            });
    },
});

export const { updateGoalProgressLocal } = goalsSlice.actions;
export default goalsSlice.reducer;
