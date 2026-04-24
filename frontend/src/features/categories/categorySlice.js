import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/api';

// GHI CHÚ HỌC TẬP - Phần danh mục của Thành Đạt:
// Slice này tải danh mục thu/chi từ backend để các màn hình giao dịch, ví và báo cáo dùng chung.
// Danh mục có thể là INCOME hoặc EXPENSE và có thể có parent_id để tạo cấu trúc cha-con.

// Lấy toàn bộ danh mục; backend đã yêu cầu đăng nhập qua categoryRoutes.
export const fetchCategories = createAsyncThunk(
    'categories/fetchAll',
    async (_, { rejectWithValue }) => {
        try {
            const res = await api.get('/categories');
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'CATEGORY_LOAD_FAILED');
        }
    }
);

const categorySlice = createSlice({
    name: 'categories',
    initialState: {
        categories: [],
        isLoading: false,
        error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            // Ba trạng thái chuẩn của request: đang tải, thành công, thất bại.
            .addCase(fetchCategories.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchCategories.fulfilled, (state, action) => {
                state.isLoading = false;
                // categories là nguồn dữ liệu để dropdown chọn danh mục hiển thị trên frontend.
                state.categories = action.payload;
            })
            .addCase(fetchCategories.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            });
    },
});

export default categorySlice.reducer;
