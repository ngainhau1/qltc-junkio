# Nâng Cấp Mô Hình Dữ Liệu Toàn Diện (ERD Upgrades V2)

Dựa trên lộ trình phát triển "Full Features" (bao gồm Logic định kỳ, Thuật toán nợ, Quản lý gia đình nâng cao, Mục tiêu tài chính, và Thông báo realtime), sơ đồ ERD gốc cần được **mở rộng và điều chỉnh** để đáp ứng hoàn toàn các nghiệp vụ phức tạp ở Backend.

Dưới đây là đặc tả chi tiết các nâng cấp cần thiết cho Data Schema:

---

## 1. Các Table Mới Cần Thêm (New Entities)

### 1.1. `RecurringRules` (Lịch Định Kỳ)
Tính năng Recurring Engine cần một bảng để lưu trữ các Quy tắc (Rules) sinh giao dịch tự động.
* `id` (PK, UUID)
* `user_id` (FK -> Users)
* `wallet_id` (FK -> Wallets)
* `category_id` (FK -> Categories)
* `amount` (Decimal)
* `description` (String)
* `type` (Enum: INCOME, EXPENSE)
* `frequency` (Enum: DAILY, WEEKLY, MONTHLY, YEARLY)
* `start_date` (Date)
* `end_date` (Date, Nullable)
* `next_date` (Date) - *Dùng để Cronjob/Lazy Check quét xem có cần sinh giao dịch hôm nay không.*
* `is_active` (Boolean, default: true)

### 1.2. `Goals` (Mục Tiêu Tài Chính)
Dành cho tính năng thiết lập mục tiêu tiết kiệm (Hũ chi tiêu).
* `id` (PK, UUID)
* `user_id` (FK -> Users)
* `family_id` (FK -> Families, Nullable) - *Hỗ trợ mục tiêu chung của gia đình.*
* `name` (String) - *VD: "Mua Macbook Pro"*
* `target_amount` (Decimal)
* `current_amount` (Decimal, default: 0)
* `deadline` (Date)
* `status` (Enum: IN_PROGRESS, ACHIEVED, CANCELLED)
* `image_url` (String, Nullable) - *Đường dẫn icon hoặc ảnh minh họa mục tiêu.*
* `color_code` (String, Nullable) - *Mã màu Hex để hiển thị giao diện Frontend.*

### 1.3. `Notifications` (Thông Báo Hệ Thống)
Lưu trữ các thông báo hệ thống, cảnh báo ngân sách, nhắc nợ.
* `id` (PK, UUID)
* `user_id` (FK -> Users)
* `type` (Enum: BUDGET_ALERT, FAMILY_INVITE, DEBT_REMINDER, SYSTEM_UPDATE)
* `title` (String) - *Tiêu đề ngắn.*
* `message` (Text) - *Nội dung chi tiết.*
* `is_read` (Boolean, default: false)
* `data` (JSONB/JSON) - *Lưu metadata linh hoạt (VD: `{"transaction_id": "..."}` để click chuyển trang).*
* `created_at` (Timestamp)

### 1.4. `Invitations` (Mã Tham Gia Gia Đình)
Quản lý các mã code Invite để join Family.
* `id` (PK, UUID)
* `family_id` (FK -> Families)
* `code` (String, Unique) - *VD: "ABCD-1234"*
* `invited_by` (FK -> Users)
* `expires_at` (Timestamp)
* `status` (Enum: PENDING, USED, EXPIRED)

### 1.5. `TransactionShares` (Chi Tiết Phân Bổ Nợ Nhóm)
Bảng cốt lõi để thực thi thuật toán Debt Simplification. Dùng khi một giao dịch được chia cho nhiều người cùng trả.
* `id` (PK, UUID)
* `transaction_id` (FK -> Transactions) - *Giao dịch gốc sinh ra khoản nợ.*
* `user_id` (FK -> Users) - *Người đang mắc nợ.*
* `amount` (Decimal) - *Số tiền phải trả cho giao dịch này.*
* `is_paid` (Boolean, default: false) - *Trạng thái đã thanh toán chưa.*
* `paid_at` (Timestamp, Nullable) - *Thời điểm tất toán khoản nợ.*

---

## 2. Nâng Cấp Các Table Hiện Có (Existing Entities)

### 2.1. Bảng `Transactions` (Giao dịch cốt lõi)
Nâng cấp để hỗ trợ "Chuyển tiền" (Transfer), "Thanh toán nợ" (Settlement), và "Scan hóa đơn".
* **Thêm cột `type` mở rộng:** Cập nhật Enum thành: `INCOME`, `EXPENSE`, `TRANSFER`, `SETTLEMENT`.
* **Thêm cột `destination_wallet_id` (FK, Nullable):** Đối với loại `TRANSFER`, dùng để định tuyến tiền chuyển đến ví đích.
* **Thêm cột `recurring_rule_id` (FK, Nullable):** Track vết giao dịch sinh ra tự động từ Rule nào.
* **Thêm cột `image_url` (String, Nullable):** Lưu trữ link ảnh hóa đơn đính kèm / bill chuyển khoản.

### 2.2. Bảng `Budgets` (Ngân sách)
* **Thêm cột `alert_threshold` (Integer, default: 80):** Ngưỡng phần trăm cảnh báo (VD: Cài đặt 80, khi người dùng chi tiêu đạt mức 80% ngân sách, Cronjob sẽ tự động tạo dòng cảnh báo vào bảng `Notifications`).

### 2.3. Bảng `Families` & `FamilyMembers`
Đồng bộ Role-Based Access Control (RBAC) từ Frontend xuống Database.
* **Bảng `Families`:** Thêm `description` (Mô tả gia đình), `cover_image_url` (Ảnh bìa nhóm).
* **Bảng `FamilyMembers`:** BẮT BUỘC thêm cột `role` (Enum: `OWNER`, `ADMIN`, `MEMBER`, `VIEWER`).

### 2.4. Bảng `Wallets` (Ví tiền)
Ràng buộc chặt chẽ logic bảo mật dữ liệu.
* **Rule XOR:** * Nếu `family_id` IS NOT NULL, thì `user_id` phải là NULL (Ví dùng chung).
    * Nếu `user_id` IS NOT NULL, thì `family_id` phải là NULL (Ví cá nhân độc lập).
    * *(Triển khai bằng Check Constraint trực tiếp trên Database).*

---

## 3. Bản Đồ Liên Kết Tổng Quan (Relation Map)

```text
USER (1) --- (n) WALLETS (Personal)
USER (1) --- (n) TRANSACTIONS (Payer)
USER (1) --- (n) FAMILY_MEMBERS (Roles) -> (1) FAMILY

FAMILY (1) --- (n) WALLETS (Shared)
FAMILY (1) --- (n) INVITATIONS
FAMILY (1) --- (n) GOALS
FAMILY (1) --- (n) BUDGETS

WALLET (1) --- (n) TRANSACTIONS (Nguồn tiền đi)
WALLET (1) --- (n) TRANSACTIONS (Nguồn tiền đến - qua destination_wallet_id)
WALLET (1) --- (n) RECURRING_RULES

TRANSACTIONS (1) --- (n) TRANSACTION_SHARES (Quản lý ai đang nợ bill này)