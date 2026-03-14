# Demo kiểm thử API với Postman (Junkio Expense Tracker)

## Chuẩn bị
- Backend chạy tại `http://localhost:5000`  
  ```bash
  cd D:\Junkio-Expense-Tracker\backend
  npm install
  npm run dev
  ```
- Postman desktop đã cài.

## Import collection & environment
1. Mở Postman → **Import** → tab *File*.
2. Kéo/ chọn 2 file:
   - `D:\Junkio-Expense-Tracker\doc\Junkio.postman_collection.json`
   - `D:\Junkio-Expense-Tracker\doc\Junkio.postman_environment.json`
3. Ở góc phải, chọn environment **Junkio Dev** (baseUrl = `http://localhost:5000`).

## Chuỗi thao tác giả lập demo
1. **Login**  
   - Collections → *Junkio Expense Tracker API* → **Auth** → `POST /api/auth/login`.  
   - Body JSON: `{"email":"<your-email>","password":"<your-password>"}`.  
   - Send. Biến `accessToken` được lưu tự động trong environment.
2. **Xem thông tin phiên**  
   - `GET /api/auth/me` → Send → xác nhận 200 và thấy email.
3. **Lấy ví**  
   - Folder **Wallets** → `GET /api/wallets` → Send → copy một `id` ví để dùng bước 4.
4. **Tạo giao dịch**  
   - Folder **Transactions** → `POST /api/transactions` → Body (raw JSON):  
     ```json
     {
       "wallet_id": "<paste-wallet-id>",
       "amount": 120000,
       "type": "EXPENSE",
       "description": "Cafe team"
     }
     ```
   - Send → lưu `id` trả về (gọi là `txId`).
5. **Danh sách giao dịch**  
   - `GET /api/transactions` → Send → thấy record vừa tạo.
6. **Chi tiết giao dịch**  
   - `GET /api/transactions/:id` → thay `:id` bằng `txId` → Send → xem Wallet/Category/Shares.
7. **Xóa giao dịch**  
   - `DELETE /api/transactions/:id` → dùng `txId` → Send → nhận 200.  
   - (Tùy chọn) Gửi lại `GET /api/transactions` để xác nhận đã xóa.
8. **Admin analytics** (chỉ khi login bằng tài khoản role=admin)  
   - Folder **Admin** → `GET /api/admin/analytics` → Send → xem số liệu thống kê.

## Xử lý nhanh lỗi thường gặp
- 401: kiểm tra đã chọn env **Junkio Dev** và biến `accessToken` có giá trị; nếu trống hãy login lại.
- 400 khi tạo giao dịch: chắc chắn `wallet_id` hợp lệ, `amount` > 0, `type` ∈ {`INCOME`, `EXPENSE`}.
- 404 chi tiết: kiểm tra `txId` đúng và giao dịch chưa bị xóa.

## Seed & Demo Accounts
- Chạy migrate + seed:
  ```bash
  cd D:\Junkio-Expense-Tracker\backend
  npx sequelize-cli db:migrate
  npx sequelize-cli db:seed:all
  ```
- Admin: demo_admin@junkio.com / demo123
- User:  demo_user@junkio.com / demo123

