# Phạm vi và mục tiêu

## Phạm vi chức năng của phiên bản hiện tại
- Xác thực người dùng: đăng ký, đăng nhập, quên mật khẩu, đặt lại mật khẩu.
- Quản lý ví tiền cá nhân và ví trong bối cảnh gia đình.
- Quản lý giao dịch theo các loại chi tiêu, thu nhập và chuyển khoản.
- Quản lý mục tiêu tiết kiệm và nạp tiền vào mục tiêu.
- Quản lý nhóm gia đình và quỹ dùng chung.
- Xem báo cáo và biểu đồ tài chính.
- Xem dự báo tài chính.
- Quản lý hồ sơ cá nhân, cài đặt và đa ngôn ngữ.
- Nhận thông báo và đồng bộ một số trạng thái theo thời gian thực.
- Quản trị nền tảng với dashboard admin, thống kê và activity logs.

## Phạm vi kỹ thuật
- Frontend web xây dựng bằng React và Vite.
- Backend REST API xây dựng bằng Express và Sequelize.
- Cơ sở dữ liệu PostgreSQL.
- Redis dùng cho cache và healthcheck hệ thống.
- Docker Compose phục vụ luồng chạy tích hợp toàn hệ thống.
- Swagger và Postman phục vụ tài liệu và kiểm thử API.

## Những gì chưa nằm trong trọng tâm báo cáo
- Ứng dụng mobile native độc lập.
- Tích hợp ngân hàng hoặc ví điện tử bên thứ ba theo thời gian thực.
- Báo cáo tài chính chuẩn kế toán chuyên nghiệp.
- Cơ chế machine learning hoặc AI dự báo nâng cao ngoài mô hình hiện có.
- Hệ thống phân quyền nhiều tầng cho role `staff` với luồng quản trị riêng.

## Mục tiêu triển khai của đồ án
- Chứng minh hệ thống có thể vận hành end-to-end với frontend, backend, database và cache.
- Thể hiện rõ luồng nghiệp vụ chính qua giao diện thật và tài liệu kỹ thuật.
- Cung cấp deliverable đủ cho bảo vệ cuối kỳ: báo cáo, sơ đồ, ảnh giao diện, slide, tài liệu API và hướng dẫn sử dụng.
- Đảm bảo dự án có thể chạy bằng Docker Compose để người chấm kiểm tra nhanh.
