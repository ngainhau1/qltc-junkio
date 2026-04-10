# Hướng dẫn cài đặt và sử dụng

## 1. Yêu cầu môi trường
- Docker Desktop hoặc Docker Engine có hỗ trợ Docker Compose.
- Trình duyệt web hiện đại.
- Nếu chạy local dev: Node.js 18+, PostgreSQL và Redis.

## 2. Chạy hệ thống bằng Docker Compose
Đứng tại thư mục gốc của dự án và chạy:

```bash
docker compose up -d --build
docker compose ps
```

Sau khi các service hoạt động:
- Giao diện web: `http://localhost`
- Backend API: `http://localhost:5000`
- Swagger UI: `http://localhost:5000/api-docs`
- Healthcheck: `http://localhost:5000/health`

## 3. Quy trình sử dụng nhanh cho người chấm

### Đăng nhập người dùng thường
1. Truy cập `http://localhost`.
2. Mở màn hình đăng nhập.
3. Dùng tài khoản demo.
4. Sau khi đăng nhập, kiểm tra lần lượt các trang: Dashboard, Giao dịch, Ví tiền, Mục tiêu, Gia đình, Báo cáo, Dự báo, Cài đặt, Hồ sơ.

### Đăng nhập admin
1. Đăng xuất tài khoản hiện tại nếu cần.
2. Đăng nhập bằng tài khoản admin.
3. Truy cập `/admin`.
4. Kiểm tra các khu vực chính:
   - dashboard tổng quan
   - quản lý người dùng
   - activity logs

## 4. Luồng thao tác chính của người dùng

### Quản lý ví
- Vào trang **Ví tiền**.
- Tạo ví mới theo loại tiền mặt hoặc ngân hàng.
- Kiểm tra số dư và bối cảnh cá nhân hoặc gia đình.

### Quản lý giao dịch
- Vào trang **Giao dịch**.
- Thêm giao dịch thu, chi hoặc chuyển khoản.
- Kiểm tra giao dịch xuất hiện trong danh sách và dashboard.

### Quản lý mục tiêu
- Vào trang **Mục tiêu**.
- Tạo mục tiêu tiết kiệm mới.
- Nạp tiền vào mục tiêu từ một ví cá nhân.

### Quản lý gia đình
- Vào trang **Gia đình**.
- Tạo nhóm gia đình hoặc quỹ chung.
- Chuyển bối cảnh làm việc giữa cá nhân và gia đình.

### Xem báo cáo và dự báo
- Vào trang **Báo cáo** để xem biểu đồ và thống kê.
- Vào trang **Dự báo** để xem xu hướng tài chính ước lượng.

## 5. Tài liệu API và kiểm tra hệ thống
- Swagger UI dùng để xem và thử API trực tiếp.
- Bộ Postman có sẵn trong `docx/07-tham-chieu/postman/`.
- Healthcheck giúp xác nhận backend, PostgreSQL và Redis đang hoạt động.

## 6. Phụ lục local development
Nếu không chạy Docker Compose:

```bash
cd backend
npm install
npm run dev
```

Mở terminal mới:

```bash
cd frontend
npm install
npm run dev
```

Backend mặc định chạy ở `http://localhost:5000`, frontend local ở `http://localhost:5173`.
