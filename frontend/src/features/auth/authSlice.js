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
            state.user = {
                ...action.payload,
                avatarUrl: action.payload.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${action.payload.name || 'demo'}`,
                phone: action.payload.phone || '',
                dateOfBirth: action.payload.dateOfBirth || '1990-01-01'
            };
            state.isAuthenticated = true;
            state.token = 'mock-jwt-token-' + new Date().getTime();
            localStorage.setItem('auth_token', state.token);
            localStorage.setItem('mock_user', JSON.stringify(state.user));
        },
        logout: (state) => {
            state.user = null;
            state.isAuthenticated = false;
            state.token = null;
            localStorage.removeItem('auth_token');
            localStorage.removeItem('mock_user');
        },
        checkAuth: (state) => {
            const token = localStorage.getItem('auth_token');
            if (token) {
                state.isAuthenticated = true;
                state.token = token;
                const savedUser = localStorage.getItem('mock_user');
                if (savedUser) {
                    state.user = JSON.parse(savedUser);
                } else if (!state.user) {
                    state.user = {
                        id: 'user-default-001',
                        name: 'Demo User',
                        email: 'demo@junkio.com',
                        role: 'MEMBER',
                        avatarUrl: 'https://api.dicebear.com/7.x/notionists/svg?seed=DemoUser',
                        phone: '0987654321',
                        dateOfBirth: '1995-10-25'
                    }
                }
            }
        },
        updateProfile: (state, action) => {
            if (state.user) {
                state.user = { ...state.user, ...action.payload };
                localStorage.setItem('mock_user', JSON.stringify(state.user));
            }
        }
    },
});

export const { login, logout, checkAuth, updateProfile } = authSlice.actions;
export default authSlice.reducer;
