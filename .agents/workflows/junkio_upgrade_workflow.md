---
description: Lộ trình và quy trình thực hiện nâng cấp toàn diện hệ thống quản lý chi tiêu Junkio
---
# Workflow Nâng Cấp Hệ Thống Junkio Dựa Trên Đánh Giá Kiến Trúc

Workflow này chia quá trình đại tu hệ thống thành 4 giai đoạn logic, đi từ việc vá lỗi khẩn cấp thiết yếu nhất, cải thiện bộ máy logic cốt lõi, cho đến tích hợp các công nghệ AI và Fintech tiên tiến.

## Giai Đoạn 1: Vá Lỗi Khẩn Cấp & Tăng Cường Bảo Mật (Hotfixes & Security)
// turbo
1. Khôi phục xuất báo cáo PDF tiếng Việt: 
   - Sử dụng base64 để import bộ font tương thích Unicode (Roboto/Noto Sans) vào VFS của `jsPDF`.
   - Chỉnh sửa `frontend/src/services/exportService.js`, loại bỏ hoàn toàn việc gọi `removeVietnameseTones`.
2. Hoàn thiện tính năng kết xuất dữ liệu Excel (XLSX) sử dụng thư viện `xlsx` có sẵn.
3. Đảm bảo tính Nguyên tử (Atomicity) cho giao dịch chuyển tiền:
   - Cập nhật logic backend (`backend/controllers/transactionController.js`).
   - Sử dụng `sequelize.transaction()` (COMMIT & ROLLBACK) trong thao tác điều chuyển ví.
4. Nâng cấp bảo mật API (Rate Limiting & JWT Token Rotation):
   - Cài đặt `express-rate-limit` để bảo vệ tài khoản, tránh Brute-force.
   - Triển khai Access Token (ngắn hạn) và Refresh Token (dài hạn, lưu trữ HTTP-Only Cookie an toàn).

## Giai Đoạn 2: Xây Dựng & Nâng Cấp Logic Cốt Lõi (Core Logic Enhancements)
1. Triển khai Động cơ Giao dịch định kỳ (Recurring Transactions) (Code Backend):
   - Tạo model `RecurringPattern` trên Backend và thiết lập quan hệ.
   - Cài đặt thư viện `node-cron`.
   - Tạo scheduler cron-job chạy ngầm mỗi đêm để kiểm tra và sinh giao dịch tĩnh.
2. Tái cấu trúc Thuật toán Đơn giản hóa Công nợ (Debt Simplification):
   - Phân tích mã nguồn `frontend/src/utils/debtSimplification.js`.
   - Chuyển từ "Greedy Algorithm" sang ứng dụng "Minimum Cost-Flow" để tránh tạo lệnh trả tiền chéo phi lý.
3. Bổ sung Phân hệ Nhật ký Kiểm toán (Audit Logging):
   - Tạo bảng `audit_logs` để lưu vết mọi thao tác Cập nhật, Thay đổi, Xóa.
   - Ghi lại vết của user thao tác trên tài sản thuộc Wallet của Gia đình.

## Giai Đoạn 3: Dịch Chuyển Microservices & Tương Tác Trí Tuệ Nhân Tạo (AI)
1. Phân tách Kiến trúc Hướng Sự kiện (Event-Driven Architecture):
   - Thêm Message Broker như Redis (Pub/Sub) vào `docker-compose.yml`.
   - Ứng dụng WebSocket để trả dữ liệu Non-blocking.
2. Tích hợp AI OCR Quét Hóa Đơn:
   - Dựng 1 microservice bằng Python (FastAPI/Flask).
   - Tích hợp pipeline Computer Vision để nhận dạng, bóc tách `Date`, `TotalAmount`, `Vendor` từ ảnh người dùng tải lên.
3. AI Dự báo cảnh báo dòng tiền (Deep Learning/LSTM):
   - Phân tích chuỗi thời gian của lượng transactions lớn (thông qua seeders).
   - Đưa ra điểm dự báo và cảnh báo vỡ nợ ngắn hạn cho ví gia đình.

## Giai Đoạn 4: Trải Nghiệm Mới & Chuẩn Mực Fintech (Open Banking & Gamification)
1. Cấu trúc lại giao diện với Trò chơi hóa (Gamification):
   - Thay đổi các file JSX, lồng ghép thư viện `framer-motion`.
   - Sáng tạo bảng trao huy hiệu hoàn thành mục tiêu. Cung cấp "Cú huých hành vi" (Nudges) tương tác với người dùng ở Dashboard.
2. Thiết kế mô phỏng Hệ thống Cổng API Ngân Hàng Mở (Open Banking):
   - Xây dựng Controller xử lý chuẩn OAuth 2.0 (Token, Consent Management).
   - Tạo webhook sandbox giả lập nhận dữ liệu giao dịch trực tiếp từ nhà băng theo nghị định 64/2024/TT-NHNN.
