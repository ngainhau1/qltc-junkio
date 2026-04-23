# Junkio Expense Tracker

**Junkio Expense Tracker** là một ứng dụng web quản lý tài chính cá nhân và gia đình toàn diện (Full-stack). Ứng dụng giúp bạn kiểm soát dòng tiền, lập ngân sách, cập nhật mục tiêu tiết kiệm và theo dõi chi phí trong một hoặc nhiều quỹ chung một cách minh bạch, an toàn và đồng bộ.

---

## 🛠 Nền tảng Công nghệ (Tech Stack)

Dự án được xây dựng dựa trên các công nghệ và bộ thư viện hiện đại để tối ưu hóa hiệu suất và trải nghiệm người dùng:

### 1. Frontend (Giao diện người dùng)
- **Core Framework**: React, Vite (Trình đóng gói siêu tốc).
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

## 🚀 Hướng dẫn Cài đặt & Khởi chạy (Getting Started)

Dưới đây là hướng dẫn chi tiết từng bước để một Node Developer thiết lập, cấu hình và khởi chạy toàn bộ hệ thống dự án hoàn toàn từ con số 0.

### Bước 1: Yêu cầu cấu hình hệ thống (Prerequisites)
Bạn cần đảm bảo máy tính đã cài đặt sẵn các nền tảng sau:
- **Node.js** (Phiên bản v18.x trở lên)
- **npm** (Phiên bản đi kèm với Node.js)
- **Git** (Dùng để clone mã nguồn dự án)
- **PostgreSQL** (Hệ quản trị cơ sở dữ liệu Relation, phiên bản 13 trở lên)
- **Redis Server** (Máy chủ Cache)
  - _Lưu ý về Redis ở Windows_: Redis không còn hỗ trợ phiên bản chạy Native trên Windows 10/11. Bạn hãy cài đặt **Memurai** (một phiên bản phân tách 100% tương thích API của Redis) hoặc chạy thông qua Windows Subsystem for Linux (WSL). Memurai sau khi cài mặc định sẽ mở port 6379 để sử dụng.

### Bước 2: Checkout / Clone mã nguồn
Tải mã nguồn toàn bộ dự án về máy tính của bạn:
```bash
git clone <đường_dẫn_git_repo_của_bạn>
cd Junkio-Expense-Tracker
```

### Bước 3: Chuẩn bị Storage & Caching
Mở công cụ quản trị PostgreSQL (ví dụ pgAdmin hoặc dbeaver) trên máy tính và thao tác tạo một cơ sở dữ liệu mới tinh.

1. **Khởi tạo Database PostgreSQL**:
   - Tạo DB tên là `expense_tracker_db` (hoặc tên tuỳ ý do bạn muốn).
   - Kiểm tra xem username/password của tài khoản đăng nhập Postgres máy tính bạn là gì (thường user mặc định là `postgres`).
2. **Khởi chạy máy chủ Redis**: Đảm bảo service Redis đang chạy và lắng nghe ở port `6379` ở localhost.

### Bước 4: Cài đặt và cấu hình Backend
Chúng ta sẽ thiết lập môi trường Backend trước tiên.

Đi vào thư mục backend và cài đặt thư viện:
```bash
cd backend
npm install
```

Thiết lập biến môi trường chuẩn (`.env`). Bạn cần sao chép/đổi tên file mẫu được cấp sẵn là `.env.example` thành file tên `.env`. Sau đó mở tệp `.env` lên bằng trình soạn thảo và **tự cá nhân hóa các chuỗi biến** theo môi trường máy bạn:

```bash
# File: backend/.env

# Cấu hình Cổng backend
PORT=5000

# Cấu hình kết nối DB mà bạn vừa thiết lập ở Bước 3
DB_HOST=localhost
DB_USER=postgres            # ĐIỀU CHỈNH: tên người dùng PostgreSQL trên máy tính của bạn
DB_PASS=123456              # ĐIỀU CHỈNH: mật khẩu đăng nhập DB của máy bạn
DB_NAME=expense_tracker_db  # Tên Database

# Cấu hình bảo mật (Vô cùng quan trọng)
# HÃY ĐIỀU CHỈNH: Đừng dùng text thông thường, hãy tự khởi tạo mật khẩu băm UUID ngẫu nhiên để an toàn tối đa.
JWT_SECRET=THAY_BANG_CHUOI_BIMAT_BATKY_TU_TAO_RADA
JWT_REFRESH_SECRET=THAY_BANG_CHUOI_REFRESH_BIMAT_KHACH_RADA

# Cấu hình Redis
REDIS_HOST=localhost
REDIS_PORT=6379

SEQUELIZE_LOG=false
VITE_FRONTEND_URL=http://localhost:5173

# Cấu hình Mail Server (Bắt buộc nếu muốn dùng tính năng Quên Mật Khẩu, Lời Mời Nhóm, Báo Cáo...)
# GỢI Ý: Lên Google hoặc Gmail tạo một "mật khẩu ứng dụng" SMTP.
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=mat_khau_ung_dung_cua_ban

# Tùy chỉnh chế độ Mẫu dữ liệu ban đầu
# Đổi AUTO_SEED=true nếu bạn muốn chạy migration sau đó tự động chèn vào dữ liệu người dùng ảo rác để check nhanh UI.
AUTO_SEED=true
```

_Sau khi đã lưu file `.env`_, hãy khởi động lệnh `npm start` hoặc `npm run dev` trong thư mục backend. Các script của hệ thống sẽ tự động bắt lấy cơ sở dữ liệu rỗng của bạn, tạo mọi cấu trúc bảng (Table migration) lên PostreSQL. Màn hình console xuất hiện dòng chữ "Database connected... Listening on Port 5000" cho thấy máy chủ đã sống.

### Bước 5: Cài đặt và cấu hình Frontend (Giao diện)
Cửa sổ Backend hãy để nó chạy nguyên. Mở một cửa sổ Terminal/Command Prompt thứ hai và trỏ vào:
```bash
cd frontend
npm install
```

Frontend của dự án sử dụng `Vite proxy` để nối nối vòng sang backend. Vì thế đối với Frontend, bạn không cần phải setup file `.env` rườm rà (tất cả các requests gọi `/api` sẽ được chuyển tiếp qua cổng `localhost:5000`).

Sau khi cài xong package Frontend, bạn gọi lện:
```bash
npm run dev
```

Kiểm tra terminal sẽ thấy đường Link của trang Web (chúng mặc định được gắn trên `http://localhost:5173`). Dùng trình duyệt bất kỳ truy cập vào đường link đó để chiêm ngưỡng nền tảng!

---

### Tự chọn: Triển khai thông qua Docker Compose 🐳
Trường hợp bạn có Docker Desktop mà không muốn phải cài đặt lằng nhằng PostgreSQL, Redis, Node... bạn có thể nhảy thẳng vào Docker, dựng 4 trạm máy chủ trong vòng "một nút bấm":

Cũng **bắt buộc** phải lập trước một file `backend/.env` đầy đủ các biến quan trọng như hướng dẫn ở Bước 4 (ví dụ cấu hình SMTP Gmail mật khẩu các kiểu vào file env).

Ngồi ở thư mục chứa thư mục gốc, gõ:
```bash
docker compose up -d
```
Tận hưởng thành quả truy cập qua đường mạng:
- **Cổng trang Website**: `http://localhost`
- **Cổng Backend API**: `http://localhost:5000`

---

## 🔐 Dữ liệu Trải nghiệm mẫu (Demo Data)
Nếu ở Bước 4 biến môi trường `AUTO_SEED=true`, các accounts rác mồi khởi tạo dưới đây đã có sẵn để thẩm định tính năng:

| Cấp Quyền | Tên Đăng Nhập | Mật Khẩu |
|---|---|---|
| Admin Hệ Thống | `admin@junkio.com` | `admin123` |
| Quản Trị Viên (Staff) | `staff@junkio.com` | `staff123` |
| Người dùng thường | `demo@junkio.com` | `demo123` |

---

## 🧪 Tài liệu API & Test Automation

### Hệ Thống Tài liệu API
- **Swagger Interactive UI**: Hỗ trợ gọi API sống, theo dõi param / error body tại endpoint `http://localhost:5000/api-docs` (sau khi backend chạy).
- **Postman Workspace**: Collection và các bộ Environment giả lập sẵn sàng nằm trong `docx/07-tham-chieu/postman/` ở thư mục Root.

### Quy trình chạy Test tự động hóa (QA)
Toàn bộ dự án đi kèm hệ thống kiểm thử tự động Automation 100%, bạn có thể dễ dàng chạy các bộ công cụ rà soát lỗi cú pháp và regression testing bằng NPM:

**Kiểm thử máy chủ Backend:**
```bash
npm --prefix backend run test:smoke   # Unit/Integration test lõi (Auth, Transaction)
npm --prefix backend run test:newman  # Kiểm thử tự động trên diện rộng bộ Postman API
npm --prefix backend run check:admin  # Kiểm tra tính đồng bộ phân quyền logic
```

**Kiểm thử giao diện Frontend:**
```bash
npm --prefix frontend run lint        # Quét ESLint kiểm duyệt code format
npm --prefix frontend test            # Chạy Vitest test hàm Logic, hooks
npm --prefix frontend run test:i18n   # Test toàn vẹn cấu trúc file dịch thuật JSON
npm --prefix frontend run test:e2e    # Chạy bộ khung Playwright automation user UI test
```
