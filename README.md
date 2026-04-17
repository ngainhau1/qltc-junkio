# Junkio Expense Tracker

**Junkio Expense Tracker** là một ứng dụng web quản lý tài chính cá nhân và gia đình toàn diện (Full-stack). Ứng dụng giúp bạn kiểm soát dòng tiền, lập ngân sách, cập nhật mục tiêu tiết kiệm và theo dõi chi phí trong một hoặc nhiều quỹ chung một cách minh bạch, an toàn và đồng bộ.

---

## 🛠 Nền tảng Công nghệ (Tech Stack)

Dự án được xây dựng dựa trên các công nghệ và bộ thư viện hiện đại để tối ưu hóa hiệu suất và trải nghiệm người dùng:

### 1. Frontend (Giao diện người dùng)
- **Core Framework**: React 19, Vite (Trình đóng gói siêu tốc).
- **Styling**: Tailwind CSS v3 (Utility-first CSS) chuyên trị độ co giãn trên nhiều thiết bị.
- **UI Components & UX**:
  - **Radix UI**: Xây dựng các khối component cốt lõi có độ tương tác và tính truy cập (Accessible) cao.
  - **Icons**: `lucide-react` (Bộ icon đồng nhất hệ thống) và `react-icons` (Brand icons của các hãng lớn như Google, Facebook).
  - **Sonner**: Hệ thống thông báo toast notification siêu mượt.
- **Quản trị Logic**:
  - **State Management**: Redux Toolkit (Quản lý trạng thái toàn cục ứng dụng).
  - **Quản lý Form & Bắt lỗi**: Formik và Yup (Xử lý chuỗi nhập liệu hiệu quả).
- **Tính năng mở rộng (Libraries)**:
  - **Đa ngôn ngữ (i18n)**: `react-i18next` và `i18next-browser-languagedetector` (Sẵn sàng cho Tiếng Việt & Tiếng Anh).
  - **Biểu đồ**: `recharts` (Đồ thị số liệu tài chính thời gian thực).
  - **WebSockets**: `socket.io-client` (Phản hồi các thông báo realtime chéo thiết bị).
  - **Xuất báo cáo (Export)**: `jspdf` & `jspdf-autotable` (PDF Reports), `papaparse` (CSV), `xlsx` (Excel Export).

### 2. Backend (Máy chủ API)
- **Core Platform**: Node.js 18+ kết hợp Express.js lõi.
- **ORM & Database**: 
  - Sequelize ORM (Mô hình hóa dữ liệu).
  - PostgreSQL (Hệ quản trị cơ sở dữ liệu Relation DBMS chính).
  - Redis (Caching tốc độ cao cho Session và xử lý Request).
- **Bảo mật & Auth**: 
  - `jsonwebtoken` (Xác thực 2 lớp kết hợp Access Token tĩnh và Refresh Token nhét trong Cookie).
  - `bcrypt` (Chuẩn mã hóa mật khẩu 1 chiều mạnh).
  - `express-rate-limit` (Chặn spam lưu lượng).
- **Các Tiện ích Hệ thống (Utilities)**:
  - Tác vụ Lịch trình: `node-cron` (Ping nhắc nhở, quét job hàng ngày).
  - Tương tác Tức thời: `socket.io` (Realtime events server).
  - Gửi Email: `nodemailer` (Hệ thống SMTP Gửi thư).

### 3. Workflow Testing & DevOps
- **Kiểm thử Tự động (Testing)**: Jest cho Backend (Unit & Integration), Vitest cho Frontend unit, Playwright cho E2E Testing.
- **CI/CD Endpoint**: NewmanCLI (Kiểm tra Regression trên tập API Postman).
- **DevOps**: Docker & Nginx Reverse Proxy (Đóng gói và triển khai môi trường Docker Compose trọn gói).

---

## 🧠 Chuyên Sâu Kỹ Thuật (Technical Engineering)

### 1. Thuật Toán Tối Giản Nợ (Bipartite Greedy Matching)
Junkio giải quyết bài toán phức tạp trong việc chia sẻ chi phí gia đình/nhóm bằng cách áp dụng phiên bản tùy chỉnh của thuật toán dòng chảy mạng (Network Flow / Greedy Matching). 
- **Đầu vào:** Một mảng lịch sử nợ chéo (A nợ B, B nợ C).
- **Quy trình:** Tính toán (Net Balance) để phân tách chủ nợ và con nợ. Thực hiện Greedy Matching giảm 10+ giao dịch rườm rà xuống chỉ còn 2-3 giao dịch bắt buộc.
- **Complexity:** `O(N log N)` do thuật toán dựa trên phép Timsort.

### 2. Bộ Nhớ Đệm Tốc Độ Cao (Redis Caching Layer)
Bảo vệ cơ sở dữ liệu `postgres` khỏi bão Tsunami (DDoS/High traffic) bằng cách tích hợp trực tiếp Redis middleware vào kiến trúc.
- **Cơ chế:** Các API nặng như `/api/analytics/dashboard` được bọc bởi `redisCache.js`. Trả về Memory Cache nhanh hơn **~90%** so với query SQL truyền thống.

### 3. Nguyên Tắc ACID (Sequelize Managed Transactions)
Hệ thống tiền tệ tuyệt đối không được phép sinh ra "rác" nếu đứt kết nối mạng giữa chừng. Toàn bộ Endpoint liên quan đến `Transfer` (chuyển đổi ví/trả nợ) chạy trong một `Connection Transaction`.
- **Logic:** `await sequelize.transaction()` đảm bảo hoặc là cả 2 ví được update số dư, hoặc Không có bất kỳ thay đổi nào được thực thi (Rollback hoàn toàn).

---

## ⚙️ Cấu hình Môi trường (Environment Setup)

Để project hoạt động, bạn cần cấu hình các biến môi trường cho Backend. 
Tạo một tệp `.env` bên trong thư mục `backend/` dựa trên mẫu `.env.example`:

```env
# Cấu hình Database & Redis
DB_HOST=localhost       # Đổi thành 'db' nếu chạy bằng Docker Compose
DB_PORT=5432
DB_NAME=expense_tracker_db
DB_USER=admin
DB_PASS=password123
REDIS_HOST=localhost    # Đổi thành 'redis' nếu chạy bằng Docker Compose
REDIS_PORT=6379

# Cấu hình Máy chủ & Bảo mật
PORT=5000
JWT_SECRET=super-secret-key
JWT_REFRESH_SECRET=super-refresh-key
VITE_FRONTEND_URL=http://localhost:5173 # Nơi xử lý CORS Header cho Frontend Local

# (Tùy chọn) Cấu hình Dịch vụ Email
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=587
EMAIL_USER=your_user
EMAIL_PASS=your_pass

# (Tùy chọn) Tự động sinh dữ liệu ảo (Seed Data)
AUTO_SEED=true
```
*(Tuyệt đối không lưu file .env mang mật khẩu production vào Git).*

---

## 🚀 Hướng dẫn Cài đặt & Sử dụng Dự án (Usage)

Có **2 phương án** để bắt đầu phát triển hoặc chạy thử nghiệp dự án.

### Phương án 1: Chạy với Docker Compose (Tối ưu nhất)
Phương pháp này giúp dựng cùng lúc 4 cụm máy chủ ảo (Frontend, Backend, DB PostgreSQL, Redis Cache) mà không bắt bạn cài cắm rườm rà. Yêu cầu duy nhất: Cài **Docker Desktop**.

```bash
# Đứng từ cây thư mục gốc chứa file docker-compose.yml 
docker compose up -d

# Xem log và các tiến trình xem đã xanh mượt chưa
docker compose ps
```
Lúc này bạn trải nghiệm dự án qua các cổng:
- **Trang chủ Website**: Truy cập `http://localhost`
- **Máy chủ API Backend**: `http://localhost:5000`
- **Tài liệu API Swagger**: `http://localhost:5000/api-docs`
*(Lưu ý: API Container đã được lập trình sẵn để tự động chạy database migration và cấy dữ liệu mẫu nếu có flag `AUTO_SEED=true`).*

### Phương án 2: Chạy Thủ Công Từng Nền Tảng


**Bước 1: Chuẩn bị Storage & Caching (PostgreSQL & Redis)**
Bạn cần cài đặt trực tiếp hệ quản trị Database và Caching vào máy tính Windows của mình:
1. **PostgreSQL**: Tải và cài đặt [PostgreSQL cho Windows](https://www.postgresql.org/download/windows/). Mở PgAdmin và thực hiện:
   - Tạo User Role: `admin` (Với password: `password123`)
   - Tạo Database: `expense_tracker_db` (Gán Owner là `admin`)
2. **Redis**: Vì Redis không chính thức hỗ trợ môi trường Windows, khuyến nghị tốt nhất là tải [Memurai Developer](https://www.memurai.com/) - Bản tương thích 100% Redis cho Windows. Cứ cài đặt bình thường (Next liên tục), hệ thống sẽ tự mở cổng `6379`. (Hoặc nếu máy có WSL thì cài `redis-server` trên Ubuntu).
3. **Môi trường**: Bạn chỉ cần định nghĩa `DB_HOST=localhost` và `REDIS_HOST=localhost` trong file `backend/.env`.

**Bước 2: Khởi động Backend API**
Mở thư mục `backend`, cài đặt thư viện và kích hoạt Node:
```bash
cd backend
npm install
npm run dev
```

**Bước 3: Khởi động Frontend Web**
Mở thêm một cửa sổ terminal mới hướng vào thư mục `frontend`:
```bash
cd frontend
npm install
npm run dev
```
Truy cập `http://localhost:5173` để thấy giao diện chính ứng dụng. Mọi thao tác tải ảnh, lưu CSDL đều sẽ gửi thẳng xuống Windows của bạn.

---

## 🔐 Dữ liệu Trải nghiệm mẫu (Demo Data)
Hệ thống tự động phát sinh các account (tài khoản) mẫu sau để bạn đỡ tốn thời gian đăng ký (yêu cầu bật `AUTO_SEED`):

| Cấp Quyền | Tên Đăng Nhập | Mật Khẩu |
|---|---|---|
| Admin Hệ Thống | `admin@junkio.com` | `admin123` |
| Quản Trị Viên (Staff) | `staff@junkio.com` | `staff123` |
| Người dùng thường | `demo@junkio.com` | `demo123` |

---

## 🧪 Tài liệu API & Test Automation

### Nguồn Tài liệu API
- **Swagger Interactive UI**: Hỗ trợ gọi API sống tại `http://localhost:5000/api-docs`
- **Postman Data**: Collection và Environment sẵn sàng import nằm trong `docx/07-tham-chieu/postman/` ở thư mục Root.

### Quy trình chạy Test tự động hóa (QA)
Toàn bộ dự án đi kèm hệ thống kiểm thử tự động, bạn có thể dễ dàng chạy các bộ công cụ phát hiện lỗi cú pháp và regression testing bằng NPM:

**Kiểm thử Hồi quy Backend:**
```bash
npm --prefix backend run test:smoke   # Unit/Integration test lõi (Auth, Transaction)
npm --prefix backend run test:newman  # Kiểm thử tự động trên diện rộng bộ Postman API
npm --prefix backend run check:admin  # Kiểm tra tính đồng bộ phân quyền
```

**Kiểm thử Hồi quy Frontend:**
```bash
npm --prefix frontend run lint        # Quét ESLint kiểm tra lỗi cú pháp code
npm --prefix frontend test            # Chạy Vitest thử nghiệm các Logic Utils
npm --prefix frontend run test:i18n   # Truy nguyên kiểm tra toàn vẹn bộ Dịch ngỗn ngữ
npm --prefix frontend run test:e2e    # Chạy bộ khung Playwright automation test
```
