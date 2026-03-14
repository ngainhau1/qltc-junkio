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
            return response.data; // already unwrapped by interceptor
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Đăng nhập thất bại');
        }
    }
);

export const registerUser = createAsyncThunk(
    'auth/registerUser',
    async (userData, { rejectWithValue }) => {
        try {
            const response = await api.post('/auth/register', userData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Đăng ký thất bại');
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
            return rejectWithValue(error.response?.data?.message || 'Phiên đăng nhập hết hạn');
        }
    }
);

export const uploadUserAvatar = createAsyncThunk(
    'auth/uploadUserAvatar',
    async (formData, { rejectWithValue }) => {
        try {
            const response = await api.post('/auth/avatar', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data; // { avatarUrl }
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Lỗi khi tải ảnh lên');
        }
    }
);

export const updateProfileAsync = createAsyncThunk(
    'auth/updateProfileAsync',
    async (profileData, { rejectWithValue }) => {
        try {
            const response = await api.put('/users/me', profileData);
            return response.data; // The backend returns the updated user object
        } catch (error) {
            return rejectWithValue(error.response?.data?.msg || 'Cập nhật hồ sơ thất bại');
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
                const { token, user } = action.payload || {};
                state.isAuthenticated = Boolean(token && user);
                state.token = token || null;
                state.user = user ? {
                    ...user,
                    avatarUrl: user.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${user.name}`
                } : null;
                if (token) localStorage.setItem('auth_token', token);
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
                const { token, user } = action.payload || {};
                state.isAuthenticated = Boolean(token && user);
                state.token = token || null;
                state.user = user ? {
                    ...user,
                    avatarUrl: user.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${user.name}`
                } : null;
                if (token) localStorage.setItem('auth_token', token);
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
                if (!action.payload) {
                    state.isAuthenticated = false;
                    state.user = null;
                    state.token = null;
                    localStorage.removeItem('auth_token');
                    return;
                }
                state.isAuthenticated = true;
                const user = action.payload;
                state.user = {
                    ...user,
                    avatarUrl: user.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(user.name || 'user')}`
                };
            })
            .addCase(fetchCurrentUser.rejected, (state) => {
                state.loading = false;
                // Nếu fetch me thất bại, nghĩa là token (hoặc refresh cookie) hỏng -> logout
                state.isAuthenticated = false;
                state.token = null;
                state.user = null;
                localStorage.removeItem('auth_token');
            })
            // Upload Avatar
            .addCase(uploadUserAvatar.pending, (state) => {
                state.loading = true;
            })
            .addCase(uploadUserAvatar.fulfilled, (state, action) => {
                state.loading = false;
                if (state.user && action.payload) {
                    state.user.avatarUrl = action.payload.avatarUrl || state.user.avatarUrl;
                }
            })
            .addCase(uploadUserAvatar.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Update Profile
            .addCase(updateProfileAsync.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateProfileAsync.fulfilled, (state, action) => {
                state.loading = false;
                if (state.user) {
                    state.user = { ...state.user, ...action.payload };
                }
            })
            .addCase(updateProfileAsync.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
});

export const { logout, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
