import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/api';

const initialState = {
    user: null,
    isAuthenticated: false,
    token: localStorage.getItem('auth_token') || null,
    loading: false,
    error: null
};

// --- Thunks ---
export const loginUser = createAsyncThunk(
    'auth/loginUser',
    async (credentials, { rejectWithValue }) => {
        try {
            const response = await api.post('/auth/login', credentials);
            return response.data; // { token, user: {id, name, email, role} }
        } catch (error) {
            return rejectWithValue(error.response?.data?.msg || 'Đăng nhập thất bại');
        }
    }
);

export const registerUser = createAsyncThunk(
    'auth/registerUser',
    async (userData, { rejectWithValue }) => {
        try {
            const response = await api.post('/auth/register', userData);
            return response.data; // { token, user }
        } catch (error) {
            return rejectWithValue(error.response?.data?.msg || 'Đăng ký thất bại');
        }
    }
);

export const fetchCurrentUser = createAsyncThunk(
    'auth/fetchCurrentUser',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/auth/me');
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.msg || 'Phiên đăng nhập hết hạn');
        }
    }
);

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout: (state) => {
            state.user = null;
            state.isAuthenticated = false;
            state.token = null;
            state.error = null;
            localStorage.removeItem('auth_token');
            // Tùy chọn: Gọi API backend để clear Http-only cookie 'refresh_token' nếu có Route
            api.post('/auth/logout').catch(() => { });
        },
        clearAuthError: (state) => {
            state.error = null;
        },
        updateProfile: (state, action) => {
            if (state.user) {
                state.user = { ...state.user, ...action.payload };
            }
        }
    },
    extraReducers: (builder) => {
        builder
            // Login
            .addCase(loginUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.loading = false;
                state.isAuthenticated = true;
                state.token = action.payload.token;
                state.user = {
                    ...action.payload.user,
                    avatarUrl: action.payload.user.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${action.payload.user.name}`
                };
                localStorage.setItem('auth_token', action.payload.token);
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Register
            .addCase(registerUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(registerUser.fulfilled, (state, action) => {
                state.loading = false;
                state.isAuthenticated = true;
                state.token = action.payload.token;
                state.user = {
                    ...action.payload.user,
                    avatarUrl: action.payload.user.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${action.payload.user.name}`
                };
                localStorage.setItem('auth_token', action.payload.token);
            })
            .addCase(registerUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Fetch Current User on Page Load
            .addCase(fetchCurrentUser.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchCurrentUser.fulfilled, (state, action) => {
                state.loading = false;
                state.isAuthenticated = true;
                state.user = {
                    ...action.payload,
                    avatarUrl: action.payload.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${action.payload.name}`
                };
            })
            .addCase(fetchCurrentUser.rejected, (state) => {
                state.loading = false;
                // Nếu fetch me thất bại, nghĩa là token (hoặc refresh cookie) hỏng -> logout
                state.isAuthenticated = false;
                state.token = null;
                state.user = null;
                localStorage.removeItem('auth_token');
            });
    }
});

export const { logout, clearAuthError, updateProfile } = authSlice.actions;
export default authSlice.reducer;
