import axios from 'axios';

// Base API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create an Axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true // Quan trọng để Backend có thể set HTTP-only cookie cho Refresh Token
});

// Request Interceptor: Attach access token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`; // Đã sửa khớp với Backend authMiddleware
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor: Xử lý lỗi token hết hạn và Refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            // Ngăn infinite loop nếu lỗi là do logout hoặc endpoint refresh bị lỗi
            if (originalRequest.url === '/auth/refresh-token' || originalRequest.url === '/auth/login') {
                return Promise.reject(error);
            }

            if (isRefreshing) {
                return new Promise(function (resolve, reject) {
                    failedQueue.push({ resolve, reject })
                }).then(token => {
                    originalRequest.headers['Authorization'] = `Bearer ${token}`;
                    return api(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Gọi API refresh token (sẽ tự động gửi HTTP-only cookie do 'withCredentials')
                const res = await axios.post(`${API_URL}/auth/refresh-token`, {}, { withCredentials: true });
                const newToken = res.data.token;

                // Cập nhật token mới vào storage
                localStorage.setItem('auth_token', newToken);

                // Retry lại các request đang pending
                processQueue(null, newToken);

                // Retry lại request hiện tại
                originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                // Nếu refresh thất bại (hết hạn 7 ngày / server lỗi) => Xóa session
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user');
                // Có thể redirect về /login thông qua events hoặc window.location
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
