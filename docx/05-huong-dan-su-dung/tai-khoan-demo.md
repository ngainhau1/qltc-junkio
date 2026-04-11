# Tài khoản demo

## Tài khoản có sẵn

| Vai trò | Email | Mật khẩu | Mục đích |
| --- | --- | --- | --- |
| Admin hệ thống | `admin@junkio.com` | `admin123` | Kiểm tra màn hình quản trị |
| Staff | `staff@junkio.com` | `staff123` | Vai trò dữ liệu phục vụ kiểm tra phân quyền |
| Người dùng thường | `demo@junkio.com` | `demo123` | Kiểm tra các chức năng nghiệp vụ chính |

## Nguồn dữ liệu
- Dữ liệu demo được sinh từ `backend/scripts/seed-demo.js`.
- Khi chạy bằng Docker Compose với `AUTO_SEED=true`, backend sẽ tự chạy seed ở thời điểm khởi động.
- Bộ dữ liệu seed bao gồm người dùng mẫu, ví, categories và một số giao dịch minh họa.
