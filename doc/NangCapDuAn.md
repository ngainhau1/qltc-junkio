# KẾ HOẠCH TRIỂN KHAI TOÀN DIỆN - JUNKIO (FULL FEATURES)

Tài liệu này tổng hợp toàn bộ các đầu việc cần làm (To-Do List) từ Cơ sở dữ liệu, Backend đến Frontend để biến Junkio thành một ứng dụng quản lý tài chính hoàn chỉnh với các tính năng: Quản lý chi tiêu, Ngân sách, Nợ nhóm, Thông báo Real-time, Chuyển khoản và Mục tiêu tiết kiệm.

---

## PHẦN 1: CƠ SỞ DỮ LIỆU (DATABASE & MIGRATIONS)
*Mục tiêu: Cập nhật Schema PostgreSQL để hỗ trợ các tính năng mới.*

### 1. Tạo bảng mới
- [ ] **Bảng `notifications` (Thông báo):**
    - `id` (UUID, PK)
    - `user_id` (UUID, FK -> users)
    - `type` (VARCHAR - Enum: `BUDGET_ALERT`, `DEBT_REQUEST`, `FAMILY_INVITE`, `SYSTEM`)
    - `title` (VARCHAR)
    - `message` (TEXT)
    - `is_read` (BOOLEAN, default: `false`)
    - `data` (JSONB - *Lưu metadata: transaction_id, wallet_id liên quan*)
    - `created_at` (TIMESTAMP)

- [ ] **Bảng `financial_goals` (Mục tiêu tài chính):**
    - `id` (UUID, PK)
    - `user_id` (UUID, FK -> users) *(Hoặc family_id nếu là mục tiêu chung)*
    - `name` (VARCHAR - *VD: Mua Macbook, Du lịch*)
    - `target_amount` (DECIMAL(18,2))
    - `current_amount` (DECIMAL(18,2), default: 0)
    - `deadline` (DATE)
    - `status` (VARCHAR - Enum: `IN_PROGRESS`, `COMPLETED`, `PAUSED`)
    - `image_url` (VARCHAR - *Icon hoặc ảnh mục tiêu*)
    - `color` (VARCHAR - *Mã Hex màu hiển thị*)

### 2. Cập nhật bảng hiện có
- [ ] **Bảng `transactions`:**
    - Thêm cột `destination_wallet_id` (UUID, Nullable, FK -> wallets) -> *Dùng cho tính năng Chuyển khoản*.
    - Thêm cột `image_url` (VARCHAR, Nullable) -> *Dùng cho tính năng Scan/Đính kèm hóa đơn*.
    - Cập nhật Enum `type` thêm giá trị: `TRANSFER`.

- [ ] **Bảng `budgets`:**
    - Thêm cột `alert_threshold` (INTEGER, Default: 80) -> *Cảnh báo khi chi tiêu vượt 80%*.

---

## PHẦN 2: BACKEND (API & BUSINESS LOGIC)
*Mục tiêu: Xử lý nghiệp vụ phức tạp và realtime.*

### 1. Transaction Module (Nâng cao)
- [ ] **API Chuyển khoản (Transfer):**
    - Endpoint: `POST /api/transactions/transfer`
    - Logic: Sử dụng **DB Transaction (ACID)** để đảm bảo:
        1. Trừ tiền ví nguồn (`wallet_id`).
        2. Cộng tiền ví đích (`destination_wallet_id`).
        3. Tạo bản ghi transaction.
        4. Rollback nếu bất kỳ bước nào lỗi.
- [ ] **API Upload hóa đơn:**
    - Endpoint: `POST /api/upload`
    - Setup: Cấu hình `Multer` (Node.js) để nhận file ảnh.
    - Lưu trữ: Upload lên Cloudinary/AWS S3 (hoặc lưu local `public/uploads`).
    - Trả về: URL ảnh để Frontend gắn vào transaction.

### 2. Notification System (Real-time & Background)
- [ ] **Socket.io Setup:**
    - Cấu hình Server Socket lắng nghe events.
    - Room logic: Join user vào room riêng theo `user_id` để nhận thông báo cá nhân.
- [ ] **Cron Job Scheduler (Tác vụ định kỳ):**
    - *Tần suất:* Chạy mỗi 1 giờ hoặc cuối ngày.
    - *Nhiệm vụ 1 (Ngân sách):* Tính tổng chi tiêu theo Category -> So sánh với Budget -> Nếu > `alert_threshold` -> Tạo record vào `notifications` -> Bắn Socket.
    - *Nhiệm vụ 2 (Định kỳ):* Quét bảng `recurring_patterns` -> Tạo transaction tự động khi đến ngày `next_run_date`.
- [ ] **API CRUD Thông báo:**
    - `GET /api/notifications` (Phân trang).
    - `PUT /api/notifications/read-all` (Đánh dấu đã đọc).

### 3. Financial Goals Module
- [ ] **API Mục tiêu:**
    - CRUD cơ bản (`GET`, `POST`, `PUT`, `DELETE`).
    - API `POST /api/goals/:id/deposit`: Nạp tiền vào mục tiêu (Trừ tiền ví chính, cộng `current_amount` mục tiêu).

---

## PHẦN 3: FRONTEND (REACT - REDUX TOOLKIT)
*Mục tiêu: Hiển thị và tương tác người dùng.*

### 1. Cập nhật Redux Store
- [ ] **`transactionsSlice.js`:**
    - Update logic `addTransaction` để xử lý case `TRANSFER` (cập nhật state của 2 ví cùng lúc).
- [ ] **`notificationsSlice.js` (Mới):**
    - State: `items: []`, `unreadCount: 0`.
    - AsyncThunk: `fetchNotifications`, `markAsRead`.
- [ ] **`goalsSlice.js` (Mới):**
    - State: `items: []` (Danh sách mục tiêu).

### 2. Nâng cấp Transaction UI
- [ ] **TransactionForm Component:**
    - Thêm Tab/Switch: **Expense | Income | Transfer**.
    - Logic Transfer: Ẩn "Category Select", hiện "Destination Wallet Select".
    - Thêm Input File/Drag & Drop zone để upload ảnh hóa đơn.
    - Hiển thị Preview ảnh trước khi submit.

### 3. Xây dựng UI mới
- [ ] **Notification Center (Trung tâm thông báo):**
    - Component Icon chuông trên Header (kèm Badge số lượng).
    - Dropdown Panel: Liệt kê thông báo, phân biệt màu sắc (chưa đọc/đã đọc).
    - Click action: Điều hướng đến trang chi tiết (Vd: click thông báo nợ -> trang Family).

- [ ] **Goals Page (Trang Mục tiêu):**
    - Hiển thị Grid các Card mục tiêu.
    - **UI Component:** Progress Bar (Thanh tiến độ) hiển thị % đạt được.
    - Modal "Nạp tiền": Form chọn ví nguồn và số tiền muốn nạp vào mục tiêu.

- [ ] **Family Debt Visualization (Hiển thị nợ):**
    - Dùng thuật toán `simplifyDebts` (đã có trong source code).
    - UI: Vẽ biểu đồ hoặc danh sách đơn giản: *"A trả cho B: 500k"*.
    - Nút "Settle Up" (Thanh toán): Tạo nhanh giao dịch trả nợ.

### 4. Tích hợp Real-time
- [ ] **Socket Client:**
    - Setup `socket.io-client` trong `App.jsx` hoặc Custom Hook.
    - Listen event `NEW_NOTIFICATION`: Dispatch action thêm thông báo mới vào Redux và hiện `Toast` (Sonner).

---

## PHẦN 4: DEPLOYMENT & ENV
- [ ] **Environment Variables (.env):**
    - `VITE_API_URL`: URL Backend.
    - `VITE_SOCKET_URL`: URL Socket Server.
    - `CLOUDINARY_URL` (nếu dùng cloud storage).
- [ ] **Docker Compose:**
    - Đảm bảo volume cho DB PostgreSQL bền vững.
    - (Optional) Thêm Redis nếu muốn cache notification hoặc session.

---

### TÓM TẮT QUY TRÌNH THỰC HIỆN
1.  **Bước 1:** Chạy Migration Database (Thêm bảng, sửa cột).
2.  **Bước 2:** Update Backend (API Transfer, Upload, Notification, Goals).
3.  **Bước 3:** Update Redux Store & Services ở Frontend.
4.  **Bước 4:** Code UI Components (Form Transfer, Goal Cards, Notify Bell).
5.  **Bước 5:** Tích hợp Socket.io để kết nối 2 đầu.