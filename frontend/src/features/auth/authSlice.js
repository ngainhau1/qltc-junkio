import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    user: null,
    isAuthenticated: false,
    token: null, // Mock token
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        login: (state, action) => {
            state.user = action.payload;
            state.isAuthenticated = true;
            state.token = 'mock-jwt-token-' + new Date().getTime();
            localStorage.setItem('auth_token', state.token);
        },
        logout: (state) => {
            state.user = null;
            state.isAuthenticated = false;
            state.token = null;
            localStorage.removeItem('auth_token');
        },
        checkAuth: (state) => {
            const token = localStorage.getItem('auth_token');
            if (token) {
                state.isAuthenticated = true;
                state.token = token;
                // In a real app we would fetch user profile here
                // For now we assume a default user if token exists
                if (!state.user) {
                    state.user = {
                        id: 'user-default-001',
                        name: 'Demo User',
                        email: 'demo@junkio.com',
                        role: 'MEMBER'
                    }
                }
            }
        }
    },
});

export const { login, logout, checkAuth } = authSlice.actions;
export default authSlice.reducer;
