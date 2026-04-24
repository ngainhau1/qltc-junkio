const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Junkio Expense Tracker API',
            version: '1.0.0',
            description: `**Chào mừng đến với thư viện API của Junkio Expense Tracker!**  

Dưới đây là các tài liệu hướng dẫn sử dụng API chi tiết dành cho Lập trình viên, Tester và Admin hệ thống. Thiết kế tuân theo chuẩn RESTful.

---
###  Hướng dẫn dành cho Người Dùng Mới (Getting Started)

Nếu bạn là người mới sử dụng API này, hãy làm theo các bước sau để xác thực:

1. **Đăng nhập (Login):** Mở route \`/api/auth/login\` và nhập email cùng mật khẩu.
2. **Lấy Token:** Copy chuỗi \`token\` trả về từ kết quả JSON (trong object \`data\`).
3. **Cấp quyền (Authorize):** Kéo lên trên cùng của trang web này, bấm vào nút **Authorize** màu xanh lá cây hoặc click vào biểu tượng 🔒 ở bất kỳ API nào, dán chuỗi token vừa copy vào ô **Value** và nhấn **Authorize**.
4. **Bắt đầu gọi API:** Nhấn \`Try it out\` ở các endpoint có yêu cầu xác thực để thực hiện các yêu cầu (Requests). Server sẽ nhận diện được phiên làm việc của bạn.

> ** Mẹo:** Swagger UI đã được cấu hình lưu lại Token kể cả khi bạn tải lại trang (Persist Authorization).

---

###  Mã Lỗi (Error Codes)
Junkio API sử dụng hệ thống \`Error Codes\` chuẩn và thông báo lỗi đa ngôn ngữ (i18n). Thay vì đọc chuỗi ký tự thô, Frontend sẽ nhận được các mã như \`WALLET_NOT_FOUND\`, \`INSUFFICIENT_BALANCE\` và tự thông dịch thành văn bản. Bạn có thể xem chi tiết mô hình phản hồi (Response) ở từng route bên dưới.`
        },
        servers: [{ url: '/' }],
        components: {
            securitySchemes: {
                bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
            }
        },
        security: [{ bearerAuth: [] }]
    },
    apis: ['./routes/*.js']
};

module.exports = swaggerJsdoc(options);
