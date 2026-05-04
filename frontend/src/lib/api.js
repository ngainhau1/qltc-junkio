import axios from 'axios';

// File này cấu hình cách frontend gọi backend, tự gắn access token, tự làm mới token 
// và chuẩn hóa response để các component sử dụng gọn hơn.

/*
 * LUỒNG XỬ LÝ ĐĂNG NHẬP VÀ REFRESH TOKEN (KHÔNG LÀM PHIỀN NGƯỜI DÙNG):
 * 1. User nhập email/password -> authSlice.loginUser -> /api/auth/login.
 * 2. Backend kiểm tra bCrypt -> Cấp JWT Token (json body) + Refresh Token (httpOnly Cookie).
 * 3. Redux lưu Access Token vào Local Storage. Component <PrivateRoutes/> cho phép user vào app.
 * 4. Sau 15 phút, gọi API lấy Transaction bị lỗi 401.
 * 5. Axios Interceptor chặn lỗi 401 -> Âm thầm gọi /api/auth/refresh-token (gửi kèm httpOnly cookie).
 * 6. Backend kiểm tra Refresh Token -> Cấp Access Token mới.
 * 7. Axios tự lấy Token mới gắn vào API Transaction bị fail ban nãy và gọi lại.
 * -> User hoàn toàn không cảm nhận được quá trình này và không bị văng ra trang đăng nhập.
 */

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    // Cho phép trình duyệt gửi cookie httpOnly refresh_token khi gọi refresh-token.
    withCredentials: true
});
//tự động đính kèm token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            // Access token được gửi trong Bearer header cho các API cần đăng nhập.
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue = [];

// Khi nhiều request cùng gặp 401, chỉ cho một request đi refresh token.
// Các request còn lại chờ trong failedQueue rồi chạy lại với token mới.
const processQueue = (error, token = null) => {
    failedQueue.forEach((promise) => {
        if (error) {
            promise.reject(error);
        } else {
            promise.resolve(token);
        }
    });
    failedQueue = [];
};
// Gọi lại token lại 1 lần và đợi lấy chúng
api.interceptors.response.use(
    (response) => {
        const payload = response.data;
        if (
            response.status >= 200 &&
            response.status < 300 &&
            payload &&
            typeof payload === 'object' &&
            'data' in payload &&
            'status' in payload
        ) {
            // Backend trả dạng { status, message, data }; frontend chỉ cần phần data.
            // _meta giữ lại status/message khi cần debug hoặc hiển thị thông báo.
            response._meta = payload;
            response.data = payload.data;
        }
        return response;
    },
    async (error) => {
        const originalRequest = error.config;
        //Nếu gặp lỗi 401 do token hết hạn
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (originalRequest.url === '/auth/refresh-token' || originalRequest.url === '/auth/login') {
                // Không tự refresh khi chính request refresh/login bị lỗi để tránh vòng lặp vô hạn.
                return Promise.reject(error);
            }
            // Nếu đã refresh
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject }); // Cho vào queue
                })
                    .then((token) => {
                        originalRequest.headers['Authorization'] = `Bearer ${token}`;
                        return api(originalRequest); // Gọi lại request trước đó
                    })
                    .catch((refreshError) => Promise.reject(refreshError));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Gọi bằng axios gốc thay vì api để không đi lại interceptor hiện tại.
                const res = await axios.post(`${API_URL}/auth/refresh-token`, {}, { withCredentials: true });
                const refreshedPayload = res.data?.data || res.data;
                const newToken = refreshedPayload?.token;

                if (!newToken) {
                    throw new Error('AUTH_TOKEN_INVALID');
                }

                localStorage.setItem('auth_token', newToken);
                processQueue(null, newToken); // Xả Queue

                // Chạy lại request ban đầu bằng access token mới.
                originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                // Refresh thất bại nghĩa là phiên đăng nhập không còn hợp lệ. Tự động trả về login
                processQueue(refreshError, null);
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;
