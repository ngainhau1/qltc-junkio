# Kiến trúc hệ thống

## Góc nhìn tổng thể
Junkio Expense Tracker là hệ thống web full-stack với kiến trúc phân lớp rõ ràng giữa frontend, backend API, cơ sở dữ liệu và hạ tầng phụ trợ. Frontend đảm nhiệm giao diện và trải nghiệm người dùng. Backend đảm nhiệm xác thực, xử lý nghiệp vụ, kết nối cơ sở dữ liệu, realtime và tài liệu API. PostgreSQL lưu trữ dữ liệu nghiệp vụ, còn Redis hỗ trợ kết nối và healthcheck.

## Thành phần chính

| Thành phần | Công nghệ | Vai trò |
| --- | --- | --- |
| Frontend Web | React 19, Vite, Redux Toolkit, Tailwind CSS | Hiển thị giao diện, quản lý state, gọi API, vẽ biểu đồ và xuất báo cáo |
| Backend API | Node.js, Express, Sequelize | Xử lý nghiệp vụ, phân quyền, truy cập dữ liệu, cung cấp REST API |
| Database | PostgreSQL | Lưu trữ dữ liệu người dùng, ví, giao dịch, mục tiêu, gia đình, ngân sách |
| Cache và hỗ trợ hệ thống | Redis | Hỗ trợ dịch vụ nền và kiểm tra sức khỏe hệ thống |
| Realtime | Socket.IO | Đồng bộ một số sự kiện và thông báo theo thời gian thực |
| Tài liệu API | Swagger UI, Postman | Tài liệu hóa và kiểm thử endpoint |
| Triển khai | Docker Compose, Nginx | Đóng gói và chạy tích hợp frontend, backend, PostgreSQL và Redis |

## Cấu trúc backend theo trách nhiệm
- **Routes**: gom nhóm endpoint theo module như `auth`, `wallets`, `transactions`, `families`, `goals`, `analytics`, `admin`, `forecast`.
- **Controllers**: tiếp nhận request và điều phối xử lý.
- **Services**: chứa các xử lý nền và nghiệp vụ hỗ trợ như email, cron job, recurring execution.
- **Models**: mô hình dữ liệu Sequelize.
- **Middleware**: auth, role, upload, response, audit.

## Cấu trúc frontend theo trách nhiệm
- **Pages**: `Dashboard`, `Transactions`, `Wallets`, `Goals`, `Family`, `Reports`, `Forecast`, `Settings`, `Profile`, `AdminDashboard`.
- **Auth layer**: `PrivateRoutes` và `AdminRoute`.
- **State management**: Redux Toolkit cho auth, analytics, wallets, families, goals, recurring, transactions.
- **UI utilities**: i18n, charts, export PDF/CSV/XLSX.

## Data flow tiêu biểu

### Luồng đăng nhập
1. Người dùng mở trang đăng nhập từ frontend.
2. Frontend gửi thông tin xác thực tới backend qua `authRoutes`.
3. Backend xác thực tài khoản, tạo token và trả về phản hồi.
4. Frontend lưu token, lấy thông tin người dùng hiện tại và điều hướng về giao diện chính.
5. Sau khi đăng nhập, frontend tiếp tục nạp wallets, families, goals, recurring, transactions và analytics.

### Luồng tạo và xem giao dịch
1. Người dùng mở màn hình giao dịch và tạo một giao dịch mới.
2. Frontend gửi request tới `transactionRoutes`.
3. Backend kiểm tra quyền, dữ liệu đầu vào và ví liên quan.
4. Sequelize ghi dữ liệu vào PostgreSQL.
5. Frontend cập nhật danh sách giao dịch, dashboard analytics và report analytics.
6. Một số trạng thái có thể được đồng bộ lại qua socket hoặc thông báo trên giao diện.

## Triển khai Docker
- `web`: frontend chạy sau khi build và phục vụ qua Nginx.
- `api`: backend Express chạy trên cổng `5000`.
- `db`: PostgreSQL dùng volume riêng cho dữ liệu.
- `redis`: Redis phục vụ thành phần phụ trợ.
- `api` phụ thuộc `db` và `redis`, còn `web` phụ thuộc `api` và `redis`.

## Ghi chú kiến trúc
- Kiến trúc hiện tại ưu tiên tính đầy đủ tính năng và khả năng chạy end-to-end cho môi trường đồ án.
- Swagger và Postman là phần quan trọng của tài liệu kỹ thuật, không phải thành phần nghiệp vụ nhưng có vai trò lớn trong kiểm thử và nghiệm thu.
- Role `admin` được tách rõ ở frontend route và backend route bằng middleware phân quyền.
