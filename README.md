<div align="center">
  <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/wallet.svg" alt="Junkio Logo" width="120" />
  <h1>Junkio Expense Tracker</h1>
  <p><strong>Ứng dụng Quản lý Tài chính Cá nhân &amp; Gia đình — Full-Stack</strong></p>

  <p>
    <img src="https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black" alt="React" />
    <img src="https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite&logoColor=white" alt="Vite" />
    <img src="https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white" alt="Node.js" />
    <img src="https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white" alt="Express" />
    <img src="https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL" />
    <img src="https://img.shields.io/badge/Socket.IO-4.x-010101?logo=socket.io&logoColor=white" alt="Socket.IO" />
    <img src="https://img.shields.io/badge/Redux-Toolkit-764ABC?logo=redux&logoColor=white" alt="Redux" />
    <img src="https://img.shields.io/badge/Jest-29-C21325?logo=jest&logoColor=white" alt="Jest" />
  </p>
</div>

---

## Giới Thiệu

**Junkio Expense Tracker** là ứng dụng quản lý tài chính toàn diện dạng **Full-Stack** dành cho cá nhân và gia đình.

- **Frontend**: React 19 + Vite, Mobile-First, Progressive Web App
- **Backend**: Node.js/Express REST API, JWT Auth, Socket.IO real-time
- **Database**: PostgreSQL với Sequelize ORM

---

## Công Nghệ Sử Dụng

### Frontend
| Thư viện | Mô tả |
|---|---|
| React 19 + Vite 6 | Core framework + build tool |
| React Router DOM v7 | Điều hướng client-side |
| Redux Toolkit | Quản lý state (Auth, Wallets, Transactions...) |
| TailwindCSS v3 + Shadcn/UI | Giao diện + component library |
| Recharts | Biểu đồ Area, Donut |
| i18next | Đa ngôn ngữ (Tiếng Việt / English) |
| date-fns | Format ngày giờ theo locale |
| socket.io-client | Nhận real-time notifications |

### Backend
| Thư viện | Mô tả |
|---|---|
| Node.js 18+ / Express 4 | REST API server |
| Sequelize + PostgreSQL | ORM + database |
| JWT (jsonwebtoken) | Access Token (15m) + Refresh Token (7d) |
| bcrypt | Mã hóa mật khẩu |
| Socket.IO | Real-time push notifications |
| Nodemailer | Gửi email reset mật khẩu |
| express-validator | Validate & sanitize input |
| jest + supertest | Backend testing |
| json2csv, pdfkit | Export CSV/PDF server-side |

---

## Tính Năng Chính

### Quản lý Tài chính
- **Giao dịch**: Tạo/xem/xóa thu chi, import CSV, export CSV/PDF/Excel
- **Chi tiết giao dịch**: Click vào bất kỳ giao dịch nào để xem đầy đủ thông tin, ví, danh mục và trạng thái chia tiền
- **Ví tiền**: Quản lý nhiều ví (tiền mặt, thẻ, tiết kiệm), tự động cập nhật số dư
- **Danh mục**: Phân loại thu chi
- **Tìm kiếm & Phân trang**: Filter theo ngày, loại, danh mục; phân trang server-side

### Gia Đình & Chia Nợ
- **Family Hub**: Quản lý chi tiêu nhóm, mời thành viên
- **Thuật toán Greedy**: Tự động tối ưu hóa các khoản nợ trong nhóm (A nợ B, B nợ C → A trả thẳng C)
- **Chia giao dịch**: Tạo giao dịch chia đều/tùy chỉnh giữa các thành viên

### Mục Tiêu & Ngân sách
- **Goals**: Hũ tiết kiệm với thanh tiến độ, nạp tiền từng đợt
- **Budget**: Đặt hạn mức chi tiêu theo danh mục, cảnh báo real-time khi vượt

### Thông Báo Real-time
- Socket.IO gửi push notification đến browser khi có cảnh báo ngân sách, nợ mới
- Toast notification tức thì, không cần refresh trang

### Xác Thực & Bảo Mật
- Đăng ký/đăng nhập với JWT (Access 15m + Refresh 7d trong httpOnly cookie)
- **Quên mật khẩu**: Gửi email reset link qua Nodemailer
- Role-based access: `member` / `admin`
- Input validation với express-validator

### Admin Dashboard
- Thống kê tổng quan: users, wallets, goals, budgets
- Biểu đồ: User Growth, Top Categories, Weekly Activity
- Quản lý người dùng: filter, đổi role, xóa tài khoản
- Financial Overview: Revenue Trends, Top Spenders, Budget Compliance

### Trải Nghiệm Di Động
- Bottom navigation bar dán mép dưới màn hình
- FAB (Floating Action Button) thêm giao dịch 1 chạm
- Form dạng Bottom Sheet (kéo từ dưới lên như iOS)
- Responsive hoàn toàn từ 320px đến 4K

---

## Hướng Dẫn Cài Đặt

### Yêu Cầu
- [Node.js](https://nodejs.org/) v18 trở lên
- [PostgreSQL](https://www.postgresql.org/) v15 trở lên
- [Git](https://git-scm.com/)

### 1. Clone Mã Nguồn

```bash
git clone https://github.com/ngainhau1/qltc-junkio.git
cd qltc-junkio
```

### 2. Cài Đặt Backend

```bash
cd backend
npm install
```

Tạo file `.env` trong thư mục `backend/`:

```env
PORT=5000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=junkio
DB_USER=postgres
DB_PASS=yourpassword

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here

# Email (Nodemailer - dùng Gmail App Password)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password_here

# Frontend URL (dùng cho CORS và email reset link)
VITE_FRONTEND_URL=http://localhost:5173
```

Tạo database và chạy migrations:

```bash
# Tạo database trong PostgreSQL trước
createdb junkio

# Chạy migrations
npx sequelize-cli db:migrate

# (Tùy chọn) Seed dữ liệu mẫu
npx sequelize-cli db:seed:all

# Khởi động backend server
npm run dev
# → Server chạy tại http://localhost:5000
```

### 3. Cài Đặt Frontend

```bash
cd ../frontend
npm install
npm run dev
# → App chạy tại http://localhost:5173
```

---

## API Endpoints

Dự án cung cấp sẵn **Postman Collection** để test toàn bộ API:

```
doc/Junkio.postman_collection.json    ← 9 requests đầy đủ
doc/Junkio.postman_environment.json   ← Environment variables
```

**Import vào Postman**: File → Import → chọn cả 2 file trên → chọn environment **"Junkio Dev"** → chạy **Login** trước (token tự động lưu).

### Các nhóm API chính

| Nhóm | Endpoint | Mô tả |
|---|---|---|
| **Auth** | `POST /api/auth/register` | Đăng ký |
| | `POST /api/auth/login` | Đăng nhập → JWT |
| | `POST /api/auth/forgot-password` | Gửi email reset |
| | `POST /api/auth/reset-password` | Đặt mật khẩu mới |
| **Transactions** | `GET /api/transactions?page=1&limit=10` | Danh sách + filter + phân trang |
| | `POST /api/transactions` | Tạo giao dịch |
| | `GET /api/transactions/:id` | Chi tiết (kèm Wallet, Category, Shares) |
| | `DELETE /api/transactions/:id` | Xóa |
| | `GET /api/transactions/export` | Export CSV/PDF |
| | `POST /api/transactions/import` | Import CSV |
| **Wallets** | `GET /api/wallets` | Danh sách ví |
| **Admin** | `GET /api/admin/analytics` | Thống kê tổng quan |
| | `GET /api/admin/users` | Quản lý users |

---

## Kiểm Thử

```bash
cd backend
npm test
# → Chạy 7 test suites, 24+ test cases với Jest + Supertest
```

Bao gồm:
- `tests/auth.test.js` — Đăng ký, đăng nhập, validation input
- `tests/transaction.test.js` — CRUD giao dịch, validation số tiền âm
- `tests/admin.test.js` — Admin endpoints
- `tests/budgetAlertService.test.js` — Cảnh báo ngân sách
- `tests/cronJobs.test.js` — Recurring transactions

---

## CI/CD

GitHub Actions pipeline tại `.github/workflows/ci.yml`:
- Lint backend với ESLint
- Chạy Jest test suite tự động khi push/PR

---

## Đóng Góp

Pull Request và Issues luôn được chào đón. Các hướng mở rộng tiềm năng:
- Đồng bộ ngân hàng qua Open Banking API
- Dịch thêm ngôn ngữ (Nhật, Hàn, Pháp) qua `i18n json`
- Mobile app (React Native / Expo)

---

<div align="center">
  <sub>Sản phẩm được xây dựng với đam mê. Full-Stack — từ Database đến UI.</sub>
</div>
