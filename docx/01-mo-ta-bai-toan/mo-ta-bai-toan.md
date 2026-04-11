# Mô tả bài toán

## Bối cảnh
Quản lý tài chính cá nhân và gia đình thường bị phân tán trên nhiều kênh như ghi chú thủ công, ứng dụng ngân hàng, ví điện tử và các bảng tính rời rạc. Khi dữ liệu thu chi không được tập trung, người dùng khó nắm được dòng tiền thực tế, khó đánh giá mức độ tuân thủ ngân sách, và càng khó kiểm soát các khoản chi dùng chung trong gia đình.

Trong bối cảnh đó, một hệ thống quản lý chi tiêu cần giải quyết đồng thời ba nhu cầu: ghi nhận giao dịch nhanh và rõ ràng, theo dõi mục tiêu tài chính theo thời gian, và hỗ trợ cộng tác trong các quỹ hoặc nhóm gia đình mà vẫn giữ được tính minh bạch và phân quyền.

## Bài toán cần giải quyết
Hệ thống Junkio Expense Tracker được xây dựng để giải quyết các nhóm vấn đề chính sau:

| Nhóm vấn đề | Mô tả thực tế | Hệ quả |
| --- | --- | --- |
| Dữ liệu phân tán | Giao dịch nằm ở nhiều ví, tài khoản, hóa đơn và ghi chú cá nhân | Không có bức tranh tổng thể về thu chi |
| Thiếu kiểm soát ngân sách | Người dùng biết mình có chi tiêu nhiều nhưng không biết vượt ở danh mục nào | Dễ vượt kế hoạch tài chính |
| Thiếu công cụ lập mục tiêu | Tiết kiệm thường không gắn với deadline hoặc mốc theo dõi cụ thể | Mục tiêu tài chính khó hoàn thành |
| Khó quản lý chi tiêu chung | Nhiều khoản chi phát sinh trong gia đình hoặc nhóm, nhưng không rõ ai góp và ai đang dùng quỹ nào | Thiếu minh bạch, khó đối soát |
| Thiếu góc nhìn phân tích | Người dùng chỉ thấy danh sách giao dịch, không thấy xu hướng và dự báo | Khó ra quyết định tài chính |

## Đối tượng sử dụng
- **Khách chưa đăng nhập**: đăng ký tài khoản, đăng nhập, yêu cầu đặt lại mật khẩu.
- **Người dùng thường**: quản lý ví, giao dịch, mục tiêu, gia đình, báo cáo, dự báo, hồ sơ và cài đặt.
- **Admin hệ thống**: theo dõi toàn cảnh nền tảng, quản lý người dùng, xem thống kê và nhật ký hoạt động.

Vai trò `staff` hiện có trong dữ liệu và phân quyền quản trị, nhưng chưa có luồng nghiệp vụ riêng đủ khác biệt để mô tả như một actor độc lập trong phạm vi báo cáo này.

## Mục tiêu của hệ thống
- Tập trung dữ liệu thu chi cá nhân và gia đình vào một hệ thống thống nhất.
- Theo dõi giao dịch theo ví, loại giao dịch và bối cảnh sử dụng.
- Quản lý ngân sách và mục tiêu tiết kiệm theo thời gian.
- Hỗ trợ quỹ gia đình và các khoản chi dùng chung.
- Cung cấp báo cáo trực quan, phân tích xu hướng và dự báo.
- Hỗ trợ quản trị hệ thống ở mức nền tảng cho admin.

## Giá trị mang lại
- Giúp người dùng thấy ngay tình hình tài chính hiện tại thay vì phải tổng hợp thủ công.
- Tăng khả năng kiểm soát chi tiêu và hạn chế vượt ngân sách.
- Hỗ trợ ra quyết định tài chính dựa trên dữ liệu và biểu đồ thay vì cảm tính.
- Nâng cao tính minh bạch cho các khoản chi chung trong gia đình.
- Tạo nền tảng để mở rộng thêm các tính năng tự động hóa, cảnh báo và phân tích nâng cao trong các phiên bản tiếp theo.
