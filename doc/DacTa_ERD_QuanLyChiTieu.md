# **ĐẶC TẢ ERD (CƠ SỞ DỮ LIỆU)**

_Hệ thống Quản lý Chi tiêu Cá nhân & Gia đình/nhóm (Web)_


_Ngày: 24/01/2026 | CSDL: PostgreSQL_

## **1. Mục đích và phạm vi**

Tài liệu này mô tả sơ đồ thực thể - liên kết (ERD) và đặc tả dữ liệu cho hệ thống quản lý chi tiêu cá nhân và gia
đình/nhóm. ERD được giữ nguyên theo phiên bản hiện tại; các quy tắc nghiệp vụ (rule) được bổ sung để tách
bạch dữ liệu cá nhân và dữ liệu gia đình/nhóm, phục vụ triển khai và kiểm thử.


- Đối tượng áp dụng: thiết kế CSDL, migrations/seeders, REST API, kiểm thử chức năng.

- Phạm vi: các bảng lõi phục vụ đăng nhập, quản lý nhóm, ví, giao dịch, danh mục, ngân sách, chia sẻ giao
dịch và xử lý công nợ.

- Bảng Notification/Thông báo không nằm trong phạm vi hiện tại (có thể bổ sung ở phiên bản sau).

## **2. Sơ đồ ERD tổng quan**

Hình 1. ERD hiện tại của hệ thống.


## **3. Quy ước dữ liệu và nguyên tắc thiết kế**

- Khóa chính (PK) dùng UUID (kiểu dữ liệu: uuid).

- Thời gian sử dụng timestamptz (timestamp with time zone) để nhất quán theo múi giờ.

- Số tiền dùng numeric(18,2) (hoặc decimal tương đương) để tránh sai số khi tính toán.

- Các ràng buộc (constraint) quan trọng có thể triển khai ở tầng CSDL hoặc tầng ứng dụng; trong phạm vi đồ
án mặc định enforce ở tầng ứng dụng, ưu tiên tính rõ ràng khi demo.


Quy ước enum (khuyến nghị):

|Trường|Giá trị đề xuất|Ý nghĩa|
|---|---|---|
|transaction_shares.status|PENDING | PAID|Trạng thái phần nợ/chia tiền của một<br>thành viên trong giao dịch chung.|
|transactions.type|INCOME | EXPENSE | TRANSFER |<br>SETTLEMENT|Loại giao dịch. TRANSFER dùng chuyển<br>ví; SETTLEMENT dùng chốt nợ trong<br>nhóm.|
|wallets.type|CASH | BANK | EWALLET | OTHER|Loại ví/nguồn tiền.|
|budgets.period|WEEK | MONTH | CUSTOM|Chu kỳ ngân sách.|
|recurring_patterns.frequency|DAILY | WEEKLY | MONTHLY|Tần suất tạo giao dịch định kỳ.|


## **4. Quy tắc tách biệt dữ liệu Cá nhân và Gia đình/nhóm**

Mục tiêu là đảm bảo người dùng có thể quản lý chi tiêu riêng và chi tiêu trong family/nhóm mà không lẫn dữ
liệu, trong khi vẫn giữ nguyên ERD hiện tại.

### **4.1 Quy tắc về Ví (wallets) - bắt buộc**

- W1 (Ownership XOR): Mỗi ví thuộc đúng 1 ngữ cảnh: cá nhân hoặc family. Cụ thể:

- - Ví cá nhân: wallets.user_id = <user_id> và wallets.family_id IS NULL.

- - Ví family: wallets.family_id = <family_id> và wallets.user_id IS NULL.

- - Không cho phép đồng thời có cả user_id và family_id, và không cho phép cả hai đều NULL.

- W2: Ví family chỉ được sử dụng bởi các thành viên có mặt trong family_members của family đó.

### **4.2 Quy tắc về Giao dịch (transactions)**

- T1: Giao dịch cá nhân được xác định khi transactions.wallet_id trỏ tới ví cá nhân (wallets.user_id != NULL).

- T2: Giao dịch family/nhóm được xác định khi transactions.wallet_id trỏ tới ví family (wallets.family_id !=
NULL).

- T3: Đối với TRANSFER/SETTLEMENT, category_id có thể NULL; đối với INCOME/EXPENSE, category_id nên
bắt buộc.

- T4: transactions.user_id là người tạo/gười trả tiền (payer/creator) để phục vụ thống kê và tính công nợ.

### **4.3 Quy tắc về Chia sẻ giao dịch (transaction_shares)**

- S1: transaction_shares chỉ áp dụng cho giao dịch family (tức wallet_id thuộc ví family).

- S2 (Uniqueness): Mỗi (transaction_id, user_id) chỉ có tối đa 1 dòng share.

- S3: Tổng số tiền share của một transaction phải bằng transactions.amount (chấp nhận sai số làm tròn nhỏ
nếu quy định).

- S4: Chỉ cho phép chuyển status từ PENDING sang PAID khi thực hiện 'Settle Debt' (trả đủ 100%).


### **4.4 Ghi chú về Categories/Budgets**

**Ghi chú:** Hiện categories và budgets có family_id. Để hỗ trợ cá nhân mà không đổi schema, có thể áp dụng 1
trong 2 cách: (a) dùng categories chung (family_id NULL) cho cá nhân; hoặc (b) tạo family 'một người' (personal
family) để dùng budgets/categories như family. Trong phạm vi tài liệu này, mặc định ưu tiên (a) hoặc tùy quyết
định triển khai.

## **5. Quan hệ giữa các bảng (Cardinality)**


|Quan hệ|Kiểu|Diễn giải|
|---|---|---|
|families (1) — (N) family_members|1-N|Một family có nhiều thành viên.|
|users (1) — (N) family_members|1-N|Một user có thể tham gia nhiều family.|
|users (1) — (N) wallets (cá nhân)|1-N|Một user có nhiều ví cá nhân.|
|families (1) — (N) wallets (family)|1-N|Một family có nhiều ví chung.|
|wallets (1) — (N) transactions|1-N|Một ví phát sinh nhiều giao dịch.|
|categories (1) — (N) transactions|1-N|Một danh mục được gán cho nhiều giao dịch<br>(INCOME/EXPENSE).|
|transactions (1) — (N) transaction_shares|1-N|Một giao dịch chung có nhiều dòng chia sẻ theo<br>thành viên.|
|families (1) — (N) categories|1-N|Family có danh mục riêng (tùy chọn).|
|families (1) — (N) budgets|1-N|Family có nhiều ngân sách theo kỳ/danh mục.|
|users (1) — (N) recurring_patterns|1-N|Một user có thể tạo nhiều mẫu định kỳ.|
|wallets (1) — (N) recurring_patterns|1-N|Mẫu định kỳ trỏ tới một ví cụ thể.|


## **6. Data Dictionary (Đặc tả bảng và cột)**

### **6.1. Bảng users**

Lưu thông tin tài khoản người dùng và xác thực đăng nhập.


Khóa chính (PK): id


Khóa ngoại (FK): Không







|Cột|Kiểu (PostgreSQL)|NULL?|Khóa/Index|Mô tả|
|---|---|---|---|---|
|id|uuid|NOT<br>NULL|PK|Định danh người dùng.|
|email|varchar|NOT<br>NULL|UNIQUE|Email đăng nhập.|
|password_hash|varchar|NOT<br>NULL||Mật khẩu đã băm (bcrypt/argon2).|
|full_name|varchar|NULL||Họ tên hiển thị.|
|is_active|boolean|NULL||Trạng thái kích hoạt tài khoản.|
|created_at|timestamptz|NULL||Thời điểm tạo tài khoản.|

### **6.2. Bảng families**

Đại diện cho một gia đình/nhóm chia sẻ chi tiêu.


Khóa chính (PK): id


Khóa ngoại (FK): owner_id -> users.id

|Cột|Kiểu (PostgreSQL)|NULL?|Khóa/Index|Mô tả|
|---|---|---|---|---|
|id|uuid|NOT<br>NULL|PK|Định danh family/nhóm.|
|owner_id|uuid|NOT<br>NULL|FK|Chủ nhóm (thường là Family<br>Manager).|
|name|varchar|NULL||Tên nhóm.|
|invite_code|varchar|NULL|UNIQUE?|Mã mời tham gia nhóm (nếu dùng).|


### **6.3. Bảng family_members**

Bảng liên kết users - families, kèm vai trò trong nhóm.


Khóa chính (PK): (family_id, user_id)


Khóa ngoại (FK): family_id -> families.id; user_id -> users.id






|Cột|Kiểu (PostgreSQL)|NULL?|Khóa/Index|Mô tả|
|---|---|---|---|---|
|family_id|uuid|NOT<br>NULL|FK|Nhóm mà user tham gia.|
|user_id|uuid|NOT<br>NULL|FK|Thành viên.|


|Cột|Kiểu (PostgreSQL)|NULL?|Khóa/Index|Mô tả|
|---|---|---|---|---|
|role|varchar|NULL||Vai trò trong nhóm<br>(Manager/Member).|
|joined_at|timestamptz|NULL||Thời điểm tham gia nhóm.|

### **6.4. Bảng wallets**

Ví/nguồn tiền, có thể là ví cá nhân hoặc ví chung của family.


Khóa chính (PK): id


Khóa ngoại (FK): family_id -> families.id; user_id -> users.id

|Cột|Kiểu (PostgreSQL)|NULL?|Khóa/Index|Mô tả|
|---|---|---|---|---|
|id|uuid|NOT<br>NULL|PK|Định danh ví.|
|family_id|uuid|NULL|FK|Nếu là ví chung thì trỏ tới family.|
|user_id|uuid|NULL|FK|Nếu là ví cá nhân thì trỏ tới user.|
|name|varchar|NULL||Tên ví (Ví tiền mặt, ATM, ...).|
|type|varchar|NULL||Loại ví (CASH/BANK/EWALLET/...).|
|balance|numeric(18,2)|NULL||Số dư hiện tại (nếu hệ thống theo<br>dõi).|
|currency|varchar|NULL||Đơn vị tiền tệ (VND, USD...).|
|is_archived|boolean|NULL||Đánh dấu lưu trữ (không dùng nữa).|


### **6.5. Bảng categories**

Danh mục thu/chi; có thể theo family hoặc dùng chung.


Khóa chính (PK): id


Khóa ngoại (FK): family_id -> families.id; parent_id -> categories.id

|Cột|Kiểu (PostgreSQL)|NULL?|Khóa/Index|Mô tả|
|---|---|---|---|---|
|id|uuid|NOT<br>NULL|PK|Định danh danh mục.|
|family_id|uuid|NULL|FK|Danh mục riêng cho family (nếu có).|
|parent_id|uuid|NULL|FK|Danh mục cha (nếu có phân cấp).|
|name|varchar|NULL||Tên danh mục (Ăn uống, Đi lại...).|
|type|varchar|NULL||income/expense.|
|icon|varchar|NULL||Icon (tên hoặc mã).|


### **6.6. Bảng transactions**

Giao dịch thu/chi/chuyển ví; là dữ liệu trung tâm của hệ thống.


Khóa chính (PK): id


Khóa ngoại (FK): user_id -> users.id; wallet_id -> wallets.id; destination_wallet_id -> wallets.id; category_id ->
categories.id























|Cột|Kiểu<br>(PostgreSQL)|NULL<br>?|Khóa/Inde<br>x|Mô tả|
|---|---|---|---|---|
|id|uuid|NOT<br>NULL|PK|Định danh giao dịch.|
|user_id|uuid|NULL|FK|Người tạo/gười trả tiền (payer/creator).|
|wallet_id|uuid|NOT<br>NULL|FK|Ví nguồn của giao dịch.|
|destination_wallet_i<br>d|uuid|NULL|FK|Ví đích (khi chuyển ví/settlement).|
|category_id|uuid|NULL|FK|Danh mục (bắt buộc cho INCOME/EXPENSE).|
|amount|numeric(18,2<br>)|NOT<br>NULL||Số tiền giao dịch.|
|description|text|NULL||Ghi chú/mô tả.|
|transaction_date|timestamptz|NULL||Thời điểm phát sinh giao dịch.|
|type|varchar|NULL||Loại giao dịch<br>(INCOME/EXPENSE/TRANSFER/SETTLEMENT)<br>.|

### **6.7. Bảng transaction_shares**

Chia sẻ số tiền phải chịu cho từng thành viên trong một giao dịch chung (phục vụ tính nợ).


Khóa chính (PK): id


Khóa ngoại (FK): transaction_id -> transactions.id; user_id -> users.id







|Cột|Kiểu (PostgreSQL)|NULL?|Khóa/Index|Mô tả|
|---|---|---|---|---|
|id|uuid|NOT<br>NULL|PK|Định danh dòng chia sẻ.|
|transaction_id|uuid|NOT<br>NULL|FK|Giao dịch chung.|
|user_id|uuid|NOT<br>NULL|FK|Thành viên phải chịu khoản này.|
|amount|numeric(18,2)|NOT<br>NULL||Số tiền thành viên phải chịu.|
|status|varchar|NULL||Trạng thái (PENDING/PAID).|

### **6.8. Bảng budgets**

Ngân sách theo family trong một khoảng thời gian (và có thể theo danh mục).


Khóa chính (PK): id


Khóa ngoại (FK): family_id -> families.id; category_id -> categories.id


|Cột|Kiểu (PostgreSQL)|NULL?|Khóa/Index|Mô tả|
|---|---|---|---|---|
|id|uuid|NOT<br>NULL|PK|Định danh ngân sách.|
|family_id|uuid|NOT<br>NULL|FK|Nhóm áp dụng ngân sách.|
|category_id|uuid|NULL|FK|Danh mục áp dụng (NULL = ngân sách<br>tổng).|
|amount_limit|numeric(18,2)|NOT<br>NULL||Hạn mức ngân sách.|
|period|varchar|NULL||Chu kỳ (WEEK/MONTH/CUSTOM).|
|start_date|date|NULL||Ngày bắt đầu.|
|end_date|date|NULL||Ngày kết thúc.|


### **6.9. Bảng recurring_patterns**

Mẫu tạo giao dịch định kỳ (có thể chưa ưu tiên nếu tập trung logic công nợ).


Khóa chính (PK): id


Khóa ngoại (FK): user_id -> users.id; wallet_id -> wallets.id; category_id -> categories.id








|Cột|Kiểu (PostgreSQL)|NULL?|Khóa/Index|Mô tả|
|---|---|---|---|---|
|id|uuid|NOT<br>NULL|PK|Định danh mẫu định kỳ.|
|user_id|uuid|NOT<br>NULL|FK|Người tạo mẫu.|
|wallet_id|uuid|NOT<br>NULL|FK|Ví áp dụng.|
|category_id|uuid|NOT<br>NULL|FK|Danh mục.|
|frequency|varchar|NULL||Tần suất (DAILY/WEEKLY/MONTHLY).|
|amount|numeric(18,2)|NOT<br>NULL||Số tiền.|
|type|varchar|NULL||Loại (income/expense).|
|next_run_date|date|NULL||Ngày chạy kế tiếp.|
|is_active|boolean|NULL||Bật/tắt mẫu.|


## **7. Ràng buộc và chỉ mục khuyến nghị**

### **7.1 Ràng buộc (Constraints)**

- C1: users.email UNIQUE.

- C2: family_members: PRIMARY KEY (family_id, user_id).

- C3: wallets: ràng buộc W1 (Ownership XOR) - enforce ở tầng ứng dụng (hoặc CHECK nếu triển khai).

- C4: transaction_shares: UNIQUE (transaction_id, user_id).

- C5: transaction_shares tổng amount theo transaction = transactions.amount (enforce ở tầng ứng dụng).


- C6: Khi transactions.type in (TRANSFER, SETTLEMENT) thì destination_wallet_id NOT NULL; ngược lại có thể
NULL.

### **7.2 Chỉ mục (Indexes)**

- I1: transactions (wallet_id, transaction_date) để lọc và phân trang theo ví + thời gian.

- I2: transactions (user_id, transaction_date) để lọc theo người tạo/payer.

- I3: transaction_shares (transaction_id) và (user_id) để tính nợ nhanh.

- I4: wallets (family_id) và wallets (user_id) để tách cá nhân/nhóm nhanh.

- I5: budgets (family_id, start_date, end_date) để đánh giá ngân sách theo kỳ.

## **8. Ánh xạ dữ liệu với nghiệp vụ chính**

### **8.1 Tính công nợ (Debt Simplification)**

- Dữ liệu đầu vào: transactions (giao dịch family) + transaction_shares (phần chia tiền) + family_members
(danh sách thành viên).

- Net balance cho mỗi user = Tổng paid (là payer) - Tổng owed (từ transaction_shares).

- Đầu ra: danh sách đề xuất chuyển tiền tối thiểu (không bắt buộc lưu vào DB).

### **8.2 Thanh toán dư nợ nhóm (Settle Debt - trả đủ 100%)**

- Tạo transactions.type = SETTLEMENT (hoặc TRANSFER) với wallet_id = ví của người trả và
destination_wallet_id = ví của người nhận.

- Cập nhật transaction_shares.status: PENDING -> PAID theo rule 'trả đủ 100%' (không cho partial).

- Sau cập nhật, số dư nợ giữa 2 người trong kỳ tương ứng về 0.

## **9. Ghi chú triển khai (Implementation Notes)**

- Migrations: tạo bảng theo thứ tự phụ thuộc FK (users -> families -> family_members -> wallets ->
categories -> transactions -> transaction_shares -> budgets -> recurring_patterns).

- Seeders: tạo tối thiểu 500-1000 bản ghi giao dịch và shares để kiểm thử phân trang/lọc/tính nợ.

- Bảo mật: mật khẩu lưu dưới dạng hash; xác thực API bằng JWT; validate dữ liệu ở backend.


