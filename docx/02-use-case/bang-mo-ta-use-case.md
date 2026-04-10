# Bảng mô tả Use Case

| Mã | Use case | Actor chính | Tiền điều kiện | Kết quả sau cùng |
| --- | --- | --- | --- | --- |
| UC-01 | Đăng ký tài khoản | Khách | Chưa có tài khoản hợp lệ | Tài khoản mới được tạo |
| UC-02 | Đăng nhập | Khách | Có tài khoản hợp lệ | Người dùng vào hệ thống và có phiên đăng nhập |
| UC-03 | Quên mật khẩu | Khách | Có email hợp lệ | Hệ thống tạo quy trình khôi phục mật khẩu |
| UC-04 | Đặt lại mật khẩu | Khách | Có token đặt lại còn hiệu lực | Mật khẩu được cập nhật |
| UC-05 | Quản lý hồ sơ và cài đặt | Người dùng | Đã đăng nhập | Thông tin hồ sơ hoặc tùy chọn được cập nhật |
| UC-06 | Quản lý ví tiền | Người dùng | Đã đăng nhập | Ví được tạo, sửa hoặc xem theo bối cảnh cá nhân hoặc gia đình |
| UC-07 | Quản lý giao dịch | Người dùng | Đã đăng nhập và có ít nhất một ví | Giao dịch được thêm, sửa, xem hoặc chuyển khoản |
| UC-08 | Quản lý mục tiêu tiết kiệm | Người dùng | Đã đăng nhập | Mục tiêu được tạo và có thể nạp tiền theo tiến độ |
| UC-09 | Quản lý gia đình và quỹ chung | Người dùng | Đã đăng nhập | Nhóm gia đình hoặc quỹ chung được tạo và sử dụng |
| UC-10 | Xem báo cáo | Người dùng | Đã đăng nhập và có dữ liệu giao dịch | Hệ thống hiển thị thống kê và biểu đồ tài chính |
| UC-11 | Xem dự báo | Người dùng | Đã đăng nhập và có dữ liệu đủ để phân tích | Hệ thống hiển thị dự báo tài chính |
| UC-12 | Nhận thông báo và đồng bộ realtime | Người dùng | Đã đăng nhập | Trạng thái mới được cập nhật lên giao diện |
| UC-13 | Xem dashboard quản trị | Admin | Đã đăng nhập với role admin | Admin xem tổng quan toàn hệ thống |
| UC-14 | Quản trị người dùng | Admin | Đã đăng nhập với role admin | Admin xem, khóa, đổi role hoặc xóa người dùng |
| UC-15 | Xem activity logs | Admin | Đã đăng nhập với role admin | Admin theo dõi nhật ký hoạt động |
| UC-16 | Xử lý nền và cron job | Hệ thống nền | Hệ thống backend đang hoạt động | Các tác vụ định kỳ và đồng bộ tự động được thực thi |
