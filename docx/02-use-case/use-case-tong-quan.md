# Use Case tổng quan

## Actor chính
- **Khách**: người chưa đăng nhập nhưng có thể tạo tài khoản hoặc khôi phục quyền truy cập.
- **Người dùng**: người đã đăng nhập và sử dụng các tính năng tài chính cá nhân hoặc gia đình.
- **Admin**: tài khoản quản trị hệ thống ở cấp nền tảng.
- **Hệ thống nền**: các thành phần tự động như cron job, realtime notification và các dịch vụ nền hỗ trợ xử lý.

## Nhóm use case theo actor

### Khách
- Đăng ký tài khoản.
- Đăng nhập.
- Quên mật khẩu.
- Đặt lại mật khẩu.

### Người dùng
- Quản lý hồ sơ và cài đặt.
- Quản lý ví tiền.
- Quản lý giao dịch.
- Quản lý mục tiêu tiết kiệm.
- Quản lý gia đình và quỹ chung.
- Xem báo cáo.
- Xem dự báo.
- Nhận thông báo và đồng bộ trạng thái.

### Admin
- Xem dashboard quản trị.
- Xem thống kê nền tảng.
- Quản trị người dùng.
- Xem activity logs.

### Hệ thống nền
- Đồng bộ dữ liệu realtime qua Socket.IO.
- Chạy cron job cho các tác vụ nền.
- Phục vụ tài liệu Swagger và kiểm tra sức khỏe hệ thống.

## Ánh xạ chức năng với mã nguồn hiện tại

| Nhóm chức năng | Bằng chứng từ repo |
| --- | --- |
| Xác thực | `frontend/src/pages/auth/*`, `backend/routes/authRoutes.js` |
| Ví tiền | `frontend/src/pages/Wallets.jsx`, `backend/routes/walletRoutes.js` |
| Giao dịch | `frontend/src/pages/Transactions.jsx`, `backend/routes/transactionRoutes.js` |
| Mục tiêu | `frontend/src/pages/Goals.jsx`, `backend/routes/goalRoutes.js` |
| Gia đình | `frontend/src/pages/Family.jsx`, `backend/routes/familyRoutes.js` |
| Báo cáo | `frontend/src/pages/Reports.jsx`, `backend/routes/analyticsRoutes.js` |
| Dự báo | `frontend/src/pages/Forecast.jsx`, `backend/routes/forecastRoutes.js` |
| Hồ sơ và cài đặt | `frontend/src/pages/Profile.jsx`, `frontend/src/pages/Settings.jsx` |
| Quản trị hệ thống | `frontend/src/pages/AdminDashboard.jsx`, `backend/routes/adminRoutes.js` |

## Ghi chú mô hình hóa
- Use case được mô hình hóa ở mức tổng quan nghiệp vụ để phục vụ báo cáo thuyết minh.
- Các thao tác nhỏ trong cùng một màn hình, ví dụ lọc dữ liệu, tìm kiếm hoặc chuyển tab, được gộp vào use case chính tương ứng.
- Role `staff` không tách riêng thành actor do chưa có một nhóm use case độc lập đủ khác với `admin` hoặc `người dùng`.
