import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/api';

// GHI CHÚ HỌC TẬP - Phần xác thực của Thành Đạt:
// Slice này lưu trạng thái đăng nhập ở frontend. Nó không tự kiểm mật khẩu,
// mà gọi API backend rồi lưu token/user để các màn hình khác biết người dùng là ai.

const initialState = {
    user: null,
    isAuthenticated: false,
    token: localStorage.getItem('auth_token') || null,
    loading: false,
    error: null
};

/**
 * Thunk xử lý đăng nhập.
 * - Gửi thông tin đăng nhập lên server.
 * - Lưu token và thông tin người dùng vào Redux state nếu thành công.
 */
export const loginUser = createAsyncThunk(
    'auth/loginUser',
    async (credentials, { rejectWithValue }) => {
        try {
            const response = await api.post('/auth/login', credentials);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'LOGIN_FAILED');
        }
    }
);

/**
 * Thunk xử lý đăng ký tài khoản mới.
 * - Gửi thông tin đăng ký (name, email, password) lên server.
 * - Tự động đăng nhập người dùng sau khi đăng ký thành công.
 */
export const registerUser = createAsyncThunk(
    'auth/registerUser',
    async (userData, { rejectWithValue }) => {
        try {
            const response = await api.post('/auth/register', userData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'REGISTER_FAILED');
        }
    }
);

/**
 * Thunk lấy thông tin người dùng hiện tại (Me).
 * - Được gọi khi ứng dụng khởi chạy hoặc khi refresh trang để kiểm tra trạng thái đăng nhập.
 * - Xác định xem token trong localStorage còn hiệu lực hay không.
 */
export const fetchCurrentUser = createAsyncThunk(
    'auth/fetchCurrentUser',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/users/me');
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'SESSION_EXPIRED');
        }
    }
);

export const uploadUserAvatar = createAsyncThunk(
    'auth/uploadUserAvatar',
    async (formData, { rejectWithValue }) => {
        try {
            const response = await api.post('/users/me/avatar', formData, {
                headers: {
                    'Content-Type': undefined
                }
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'UPLOAD_FAILED');
        }
    }
);


/**
 * Thunk cập nhật thông tin cá nhân.
 * - Cho phép thay đổi tên hoặc các thông tin profile khác của người dùng.
 */
export const updateProfileAsync = createAsyncThunk(
    'auth/updateProfileAsync',
    async (profileData, { rejectWithValue }) => {
        try {
            const response = await api.put('/users/me', profileData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'PROFILE_UPDATE_FAILED');
        }
    }
);

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        /**
         * Xử lý đăng xuất ở phía Client.
         * - Xóa thông tin user khỏi Redux Store.
         * - Xóa token trong localStorage.
         * - Gọi API logout để xóa cookie ở phía Server.
         */
        logout: (state) => {
            state.user = null;
            state.isAuthenticated = false;
            state.token = null;
            state.error = null;
            localStorage.removeItem('auth_token');
            api.post('/auth/logout').catch(() => { });
        },
        clearAuthError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // loginUser: pending bật loading, fulfilled lưu token/user, rejected lưu mã lỗi từ backend.
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
                    // Nếu người dùng chưa tải avatar, giao diện dùng avatar sinh theo tên để tránh ô trống.
                    avatarUrl: user.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${user.name}`
                } : null;
                if (token) localStorage.setItem('auth_token', token);
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(registerUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(registerUser.fulfilled, (state, action) => {
                state.loading = false;
                // Sau đăng ký thành công, backend trả token giống đăng nhập nên frontend vào thẳng trạng thái đã đăng nhập.
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
            .addCase(fetchCurrentUser.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchCurrentUser.fulfilled, (state, action) => {
                state.loading = false;
                if (!action.payload) {
                    // Không có user nghĩa là phiên hiện tại không còn dùng được.
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
                // Khi /users/me thất bại, xóa token để giao diện quay về màn đăng nhập.
                state.isAuthenticated = false;
                state.token = null;
                state.user = null;
                localStorage.removeItem('auth_token');
            })
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
