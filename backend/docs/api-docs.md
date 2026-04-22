# Junkio Expense Tracker API

**Chào mừng đến với thư viện API của Junkio Expense Tracker!**  

Dưới đây là các tài liệu hướng dẫn sử dụng API chi tiết dành cho Lập trình viên, Tester và Admin hệ thống. Thiết kế tuân theo chuẩn RESTful.

---
###  Hướng dẫn dành cho Người Dùng Mới (Getting Started)

Nếu bạn là người mới sử dụng API này, hãy làm theo các bước sau để xác thực:

1. **Đăng nhập (Login):** Go to the `/api/auth/login` route và nhập Email & Password.
2. **Lấy Token:** Copy chuỗi `token` trả về từ kết quả JSON (trong object `data`).
3. **Cấp quyền (Authorize):** Kéo lên trên cùng của trang web này, bấm vào nút **Authorize** màu xanh lá cây hoặc click vào biểu tượng 🔒 ở bất kỳ API nào, dán chuỗi token vừa copy vào ô **Value** và nhấn **Authorize**.
4. **Bắt đầu gọi API:** Nhấn `Try it out` ở các endpoint có yêu cầu xác thực để thực hiện các yêu cầu (Requests). Server sẽ nhận diện được phiên làm việc của bạn.

> ** Mẹo:** Swagger UI đã được cấu hình lưu lại Token kể cả khi bạn tải lại trang (Persist Authorization).

---

###  Mã Lỗi (Error Codes)
Junkio API sử dụng hệ thống `Error Codes` chuẩn và thông báo lỗi đa ngôn ngữ (i18n). Thay vì đọc chuỗi ký tự thô, Frontend sẽ nhận được các mã như `WALLET_NOT_FOUND`, `INSUFFICIENT_BALANCE` và tự thông dịch thành văn bản. Bạn có thể xem chi tiết mô hình phản hồi (Response) ở từng route bên dưới.

**Phien ban:** 1.0.0

---

## Admin

Quản trị hệ thống, chỉ dành cho tài khoản có role **admin**.
Tất cả các endpoint trong nhóm này yêu cầu Bearer Token của admin.
Nếu bạn chưa có quyền admin, hãy liên hệ quản trị viên hệ thống.

### GET `/api/admin/dashboard`

**Lấy tổng quan hệ thống (Platform Dashboard)**

Trả về các chỉ số tổng quan nhanh của toàn hệ thống bao gồm:
- Tổng số người dùng đăng ký
- Tổng số giao dịch đã ghi nhận
- Tổng số nhóm gia đình đang hoạt động
- Danh sách 5 người dùng đăng ký gần nhất

API này được gọi khi Admin mở trang Dashboard.

> Yeu cau xac thuc: `Bearer Token`


**Responses:**

| Code | Mo ta |
| --- | --- |
| `200` | Dữ liệu dashboard admin thành công |
| `401` | Chưa đăng nhập hoặc token hết hạn |
| `403` | Không có quyền admin |

**Response 200 - Vi du:**

```json
{
  "status": "success",
  "message": "Lấy dữ liệu Dashboard thành công",
  "data": {
    "totalUsers": 1450,
    "totalTransactions": 250000,
    "totalFamilies": 35,
    "recentUsers": [
      {
        "id": "b2df0d5d-1234-4abc-9def-bbbd02910001",
        "name": "Nguyễn Văn A",
        "email": "nguyenvana@junkio.com",
        "role": "member",
        "createdAt": "2026-03-30T10:00:00.000Z"
      },
      {
        "id": "c3ef1e6e-5678-4bcd-aef0-ccce13a20002",
        "name": "Trần Thị B",
        "email": "tranthib@junkio.com",
        "role": "member",
        "createdAt": "2026-03-29T08:30:00.000Z"
      }
    ]
  }
}
```

---

### GET `/api/admin/analytics`

**Lấy phân tích dữ liệu toàn hệ thống (System Analytics)**

Trả về dữ liệu phân tích chuyên sâu bao gồm:
- **Thống kê tổng hợp**: Tổng số ví, mục tiêu, ngân sách trên toàn hệ thống
- **Biểu đồ tăng trưởng người dùng** theo từng tháng
- **Top danh mục chi tiêu** phổ biến nhất
- **Hoạt động hàng tuần** (số giao dịch mỗi ngày trong tuần gần nhất)

Dùng để hiển thị biểu đồ trên trang Analytics của Admin Panel.

> Yeu cau xac thuc: `Bearer Token`


**Responses:**

| Code | Mo ta |
| --- | --- |
| `200` | Dữ liệu analytics thành công |
| `401` | Chưa đăng nhập hoặc token hết hạn |
| `403` | Không có quyền admin |

**Response 200 - Vi du:**

```json
{
  "status": "success",
  "message": "Lấy analytics thành công",
  "data": {
    "stats": {
      "totalWallets": 3200,
      "totalGoals": 580,
      "totalBudgets": 420
    },
    "userGrowth": [
      {
        "month": "2026-01",
        "count": 120
      },
      {
        "month": "2026-02",
        "count": 185
      },
      {
        "month": "2026-03",
        "count": 210
      }
    ],
    "topCategories": [
      {
        "name": "Ăn uống",
        "count": 45000
      },
      {
        "name": "Di chuyển",
        "count": 28000
      }
    ],
    "weeklyActivity": [
      {
        "day": "Mon",
        "transactions": 1200
      },
      {
        "day": "Tue",
        "transactions": 1350
      }
    ]
  }
}
```

---

### GET `/api/admin/financial-overview`

**Lấy tổng quan tài chính toàn hệ thống (Financial Overview)**

Cung cấp cái nhìn toàn cảnh về tình hình tài chính trên nền tảng:
- **Tổng số dư hệ thống** (tổng balance của tất cả ví)
- **Xu hướng thu/chi** theo từng tháng (dùng để vẽ biểu đồ line chart)
- **Top người chi tiêu nhiều nhất**
- **Tỷ lệ tuân thủ ngân sách** (% user giữ chi tiêu trong giới hạn budget)

Endpoint này hữu ích để Admin đánh giá sức khỏe tài chính tổng thể.

> Yeu cau xac thuc: `Bearer Token`


**Responses:**

| Code | Mo ta |
| --- | --- |
| `200` | Tổng quan tài chính thành công |
| `401` | Chưa đăng nhập hoặc token hết hạn |
| `403` | Không có quyền admin |

**Response 200 - Vi du:**

```json
{
  "status": "success",
  "message": "Lấy tổng quan tài chính thành công",
  "data": {
    "systemBalance": 15750000000,
    "revenueTrends": [
      {
        "month": "2026-01",
        "income": 850000000,
        "expense": 620000000
      },
      {
        "month": "2026-02",
        "income": 920000000,
        "expense": 710000000
      }
    ],
    "topSpenders": [
      {
        "name": "Nguyễn Văn C",
        "totalExpense": 25000000
      },
      {
        "name": "Lê Thị D",
        "totalExpense": 18500000
      }
    ],
    "budgetCompliance": 72.5
  }
}
```

---

### GET `/api/admin/users`

**Lấy danh sách người dùng toàn hệ thống**

Trả về danh sách tất cả người dùng có phân trang và bộ lọc.
- Hỗ trợ tìm kiếm theo tên hoặc email (`search`)
- Lọc theo role: member, staff, admin hoặc tất cả
- Lọc theo trạng thái: active (đang hoạt động), locked (bị khóa), hoặc tất cả

Kết quả trả về bao gồm thông tin phân trang (tổng số user, số trang).

> Yeu cau xac thuc: `Bearer Token`

**Parameters:**

| Tham so | Vi tri | Mo ta | Bat buoc | Kieu du lieu |
| --- | --- | --- | --- | --- |
| `page` | query | Số trang hiện tại (bắt đầu từ 1) | Khong | integer [mac dinh: 1] |
| `limit` | query | Số lượng user mỗi trang (mặc định 20) | Khong | integer [mac dinh: 20] |
| `search` | query | Từ khóa tìm kiếm theo tên hoặc email | Khong | string |
| `role` | query | Lọc theo vai trò người dùng | Khong | string (all, member, staff, admin) [mac dinh: all] |
| `status` | query | Lọc theo trạng thái tài khoản | Khong | string (all, active, locked) [mac dinh: all] |


**Responses:**

| Code | Mo ta |
| --- | --- |
| `200` | Danh sách người dùng thành công |
| `401` | Chưa đăng nhập hoặc token hết hạn |
| `403` | Không có quyền admin |

**Response 200 - Vi du:**

```json
{
  "status": "success",
  "message": "Lấy danh sách user thành công",
  "data": {
    "users": [
      {
        "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "name": "Admin Junkio",
        "email": "admin@junkio.com",
        "role": "admin",
        "is_locked": false,
        "createdAt": "2026-01-01T00:00:00.000Z"
      },
      {
        "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
        "name": "Nguyễn Văn Member",
        "email": "member@junkio.com",
        "role": "member",
        "is_locked": false,
        "createdAt": "2026-02-15T08:30:00.000Z"
      }
    ],
    "total": 1450,
    "page": 1,
    "totalPages": 73
  }
}
```

---

### GET `/api/admin/users/{id}`

**Lấy chi tiết một người dùng**

Trả về thông tin chi tiết của một user cụ thể, bao gồm:
- Thông tin cá nhân (tên, email, role, trạng thái khóa)
- Danh sách ví (wallets) mà user sở hữu
- Danh sách gia đình (families) mà user tham gia
- Tổng số giao dịch đã thực hiện

Admin dùng API này để xem xét hoạt động của một user trước khi quyết định khóa/xóa.

> Yeu cau xac thuc: `Bearer Token`

**Parameters:**

| Tham so | Vi tri | Mo ta | Bat buoc | Kieu du lieu |
| --- | --- | --- | --- | --- |
| `id` | path | UUID của user cần xem | Co | string (uuid) |


**Responses:**

| Code | Mo ta |
| --- | --- |
| `200` | Chi tiết user thành công |
| `404` | Không tìm thấy user (USER_NOT_FOUND) |

**Response 200 - Vi du:**

```json
{
  "status": "success",
  "message": "Lấy chi tiết user thành công",
  "data": {
    "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "name": "Nguyễn Văn Member",
    "email": "member@junkio.com",
    "role": "member",
    "is_locked": false,
    "wallets": [
      {
        "id": "w1a2b3c4-...",
        "name": "Ví MB Bank",
        "balance": 15000000
      }
    ],
    "Families": [
      {
        "id": "f1a2b3c4-...",
        "name": "Gia đình Nguyễn"
      }
    ],
    "transactionCount": 342
  }
}
```

---

### DELETE `/api/admin/users/{id}`

**Xóa vĩnh viễn một tài khoản người dùng**

Xóa hoàn toàn user khỏi hệ thống. Hành động này **không thể hoàn tác**.
Dữ liệu liên quan (ví, giao dịch, mục tiêu...) sẽ bị xóa theo.

**Lưu ý quan trọng:** Admin không thể tự xóa chính mình.

> Yeu cau xac thuc: `Bearer Token`

**Parameters:**

| Tham so | Vi tri | Mo ta | Bat buoc | Kieu du lieu |
| --- | --- | --- | --- | --- |
| `id` | path | UUID của user cần xóa | Co | string (uuid) |


**Responses:**

| Code | Mo ta |
| --- | --- |
| `200` | Xóa user thành công |
| `400` | Không được xóa chính mình (CANNOT_DELETE_SELF) |
| `404` | Không tìm thấy user (USER_NOT_FOUND) |

**Response 200 - Vi du:**

```json
{
  "status": "success",
  "message": "Xóa user thành công"
}
```

---

### PUT `/api/admin/users/{id}/toggle-lock`

**Khóa hoặc mở khóa tài khoản người dùng**

Chuyển đổi trạng thái khóa của một tài khoản:
- Nếu user đang **active** -> chuyển sang **locked** (không thể đăng nhập)
- Nếu user đang **locked** -> chuyển sang **active** (cho phép đăng nhập lại)

**Lưu ý:** Admin không thể khóa chính mình.
Khi user bị khóa, token hiện tại vẫn hoạt động cho đến khi hết hạn.

> Yeu cau xac thuc: `Bearer Token`

**Parameters:**

| Tham so | Vi tri | Mo ta | Bat buoc | Kieu du lieu |
| --- | --- | --- | --- | --- |
| `id` | path | UUID của user cần khóa/mở khóa | Co | string (uuid) |


**Responses:**

| Code | Mo ta |
| --- | --- |
| `200` | Thay đổi trạng thái khóa thành công |
| `400` | Không được khóa chính mình (CANNOT_LOCK_SELF) |

**Response 200 - Vi du:**

```json
{
  "status": "success",
  "message": "Đã khóa tài khoản user",
  "data": {
    "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "is_locked": true
  }
}
```

---

### PUT `/api/admin/users/{id}/role`

**Thay đổi vai trò (role) của người dùng**

Nâng cấp hoặc hạ cấp quyền hạn của một user trong hệ thống.
Các vai trò hợp lệ:
- `member`: Người dùng thường (mặc định khi đăng ký)
- `staff`: Nhân viên hỗ trợ (có quyền xem báo cáo)
- `admin`: Quản trị viên toàn quyền

**Lưu ý:** Admin không thể thay đổi role của chính mình.

> Yeu cau xac thuc: `Bearer Token`

**Parameters:**

| Tham so | Vi tri | Mo ta | Bat buoc | Kieu du lieu |
| --- | --- | --- | --- | --- |
| `id` | path | UUID của user cần đổi role | Co | string (uuid) |


**Request Body:**

*Content-Type:* `application/json`

| Truong | Kieu | Bat buoc | Mo ta |
| --- | --- | --- | --- |
| `role` | string | Co | staff |

**Vi du:**

```json
{
  "role": "staff"
}
```


**Responses:**

| Code | Mo ta |
| --- | --- |
| `200` | Đổi role thành công |
| `400` | Role không hợp lệ hoặc đang tự đổi role (INVALID_ROLE / CANNOT_CHANGE_OWN_ROLE) |

**Response 200 - Vi du:**

```json
{
  "status": "success",
  "message": "Đổi role thành công",
  "data": {
    "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "role": "staff"
  }
}
```

---

### GET `/api/admin/logs`

**Lấy nhật ký hệ thống (Audit Logs)**

Trả về danh sách các hành động quan trọng đã xảy ra trên hệ thống, bao gồm:
- Đăng nhập / Đăng ký người dùng
- Tạo / Xóa ví, giao dịch
- Thay đổi role, khóa tài khoản
- Các thao tác nhạy cảm khác

Hỗ trợ phân trang và lọc theo loại hành động (`action`).
Đây là công cụ quan trọng để Admin theo dõi hoạt động và phát hiện bất thường.

> Yeu cau xac thuc: `Bearer Token`

**Parameters:**

| Tham so | Vi tri | Mo ta | Bat buoc | Kieu du lieu |
| --- | --- | --- | --- | --- |
| `page` | query | Số trang hiện tại | Khong | integer [mac dinh: 1] |
| `limit` | query | Số bản ghi mỗi trang (mặc định 50) | Khong | integer [mac dinh: 50] |
| `action` | query | Lọc theo loại hành động (VD USER_LOGIN, USER_REGISTER, ROLE_CHANGED). Để ALL để xem tất cả. | Khong | string [mac dinh: ALL] |


**Responses:**

| Code | Mo ta |
| --- | --- |
| `200` | Danh sách audit logs thành công |
| `401` | Chưa đăng nhập hoặc token hết hạn |
| `403` | Không có quyền admin |

**Response 200 - Vi du:**

```json
{
  "status": "success",
  "message": "Lấy audit logs thành công",
  "data": {
    "logs": [
      {
        "id": "log-001",
        "action": "USER_LOGIN",
        "userId": "b2c3d4e5-...",
        "details": "User đăng nhập thành công",
        "createdAt": "2026-03-30T09:15:00.000Z"
      },
      {
        "id": "log-002",
        "action": "ROLE_CHANGED",
        "userId": "a1b2c3d4-...",
        "details": "Đổi role từ member sang staff",
        "createdAt": "2026-03-30T08:45:00.000Z"
      }
    ],
    "total": 5280,
    "page": 1,
    "totalPages": 106
  }
}
```

---

## Analytics

Báo cáo và thống kê tài chính cá nhân.
Cung cấp dữ liệu tổng quan (dashboard) và báo cáo chi tiết
theo tháng/năm để người dùng theo dõi tình hình tài chính.

### GET `/api/analytics/dashboard`

**Lấy số liệu tổng quan tài chính cá nhân**

Trả về dữ liệu tổng hợp cho trang Dashboard của người dùng:
- **Tổng tài sản**: Tổng số dư tất cả ví cá nhân
- **Thu nhập tháng này**: Tổng INCOME trong tháng hiện tại
- **Chi tiêu tháng này**: Tổng EXPENSE trong tháng hiện tại
- **Giao dịch gần đây**: 5-10 giao dịch mới nhất

API này được gọi mỗi khi người dùng mở trang chủ ứng dụng.

> Yeu cau xac thuc: `Bearer Token`


**Responses:**

| Code | Mo ta |
| --- | --- |
| `200` | Thống kê dashboard thành công |

**Response 200 - Vi du:**

```json
{
  "status": "success",
  "data": {
    "totalBalance": 45000000,
    "monthlyIncome": 28000000,
    "monthlyExpense": 15500000,
    "recentTransactions": [
      {
        "id": "t1-...",
        "amount": 150000,
        "type": "EXPENSE",
        "description": "Cà phê buổi sáng",
        "date": "2026-03-30"
      },
      {
        "id": "t2-...",
        "amount": 25000000,
        "type": "INCOME",
        "description": "Lương tháng 3",
        "date": "2026-03-28"
      }
    ]
  }
}
```

---

### GET `/api/analytics/reports`

**Lấy dữ liệu báo cáo tài chính theo tháng/năm**

Trả về dữ liệu báo cáo chi tiết cho một tháng/năm cụ thể.
Bao gồm: thống kê thu/chi theo danh mục, biểu đồ xu hướng,
so sánh với tháng trước.

Nếu không truyền tham số, mặc định trả về dữ liệu tháng hiện tại.

> Yeu cau xac thuc: `Bearer Token`

**Parameters:**

| Tham so | Vi tri | Mo ta | Bat buoc | Kieu du lieu |
| --- | --- | --- | --- | --- |
| `year` | query | Năm cần xem báo cáo (VD 2026) | Khong | integer |
| `month` | query | Tháng cần xem báo cáo (1-12) | Khong | integer |


**Responses:**

| Code | Mo ta |
| --- | --- |
| `200` | Dữ liệu báo cáo thành công |

**Response 200 - Vi du:**

```json
{
  "status": "success",
  "data": {
    "year": 2026,
    "month": 3,
    "totalIncome": 28000000,
    "totalExpense": 15500000,
    "categoryBreakdown": [
      {
        "category": "Ăn uống",
        "amount": 4500000,
        "percentage": 29
      },
      {
        "category": "Di chuyển",
        "amount": 3200000,
        "percentage": 21
      }
    ]
  }
}
```

---

## Auth

Xác thực người dùng và quản lý phiên đăng nhập.
Nhóm API này bao gồm đăng ký, đăng nhập, làm mới token, đăng xuất
và các chức năng khôi phục mật khẩu. Hầu hết các endpoint **không yêu cầu token**

### POST `/api/auth/register`

**Đăng ký tài khoản mới**

Tạo một tài khoản người dùng mới trên hệ thống Junkio.
Sau khi đăng ký thành công, người dùng cần **đăng nhập** để nhận JWT token.

**Yêu cầu:**
- Email phải là duy nhất trên hệ thống
- Mật khẩu tối thiểu 6 ký tự
- Tên hiển thị không được để trống


**Request Body:**

*Content-Type:* `application/json`

| Truong | Kieu | Bat buoc | Mo ta |
| --- | --- | --- | --- |
| `name` | string | Co | Tên hiển thị của người dùng |
| `email` | string | Co | Email đăng nhập (phải là duy nhất) |
| `password` | string | Co | Mật khẩu (tối thiểu 6 ký tự) |

**Vi du:**

```json
{
  "name": "Nguyễn Văn A",
  "email": "user@junkio.com",
  "password": "123456"
}
```


**Responses:**

| Code | Mo ta |
| --- | --- |
| `201` | Đăng ký thành công |
| `409` | Email đã tồn tại trên hệ thống (EMAIL_EXISTS) |
| `422` | Dữ liệu gửi lên không hợp lệ (thiếu field, sai format) |

**Response 201 - Vi du:**

```json
{
  "status": "success",
  "message": "Đăng ký thành công"
}
```

---

### POST `/api/auth/login`

**Đăng nhập và nhận JWT access token**

Xác thực thông tin đăng nhập và trả về JWT access token.

**Quy trình sử dụng token:**
1. Gọi API này với email + password
2. Copy giá trị `token` từ response
3. Click nút **Authorize** ở đầu trang Swagger UI
4. Dán token vào ô Value và nhấn Authorize
5. Tất cả các API có biểu tượng khóa sẽ tự động gửi kèm token

**Thông tin token:**
- Access token hết hạn sau **15 phút**
- Refresh token được lưu trong cookie HttpOnly, hết hạn sau **7 ngày**
- Khi access token hết hạn, gọi `/api/auth/refresh-token` để lấy token mới


**Request Body:**

*Content-Type:* `application/json`

| Truong | Kieu | Bat buoc | Mo ta |
| --- | --- | --- | --- |
| `email` | string | Co | Email đã đăng ký |
| `password` | string | Co | Mật khẩu tài khoản |

**Vi du:**

```json
{
  "email": "demo@junkio.com",
  "password": "demo123"
}
```


**Responses:**

| Code | Mo ta |
| --- | --- |
| `200` | Đăng nhập thành công, trả về token và thông tin user |
| `400` | Email hoặc mật khẩu không đúng (INVALID_CREDENTIALS) |
| `423` | Tài khoản đã bị khóa bởi admin (ACCOUNT_LOCKED) |

**Response 200 - Vi du:**

```json
{
  "status": "success",
  "message": "Đăng nhập thành công",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImIyZGYw...",
    "user": {
      "id": "b2df0d5d-1234-4abc-9def-bbbd02910001",
      "name": "Demo User",
      "email": "demo@junkio.com",
      "role": "member"
    }
  }
}
```

---

### POST `/api/auth/refresh-token`

**Làm mới access token từ refresh token cookie**

Khi access token hết hạn (sau 15 phút), Frontend tự động gọi API này
để lấy token mới mà không cần người dùng đăng nhập lại.

**Cách hoạt động:**
- Server đọc `refresh_token` từ cookie HttpOnly (tự động gửi kèm bởi trình duyệt)
- Nếu hợp lệ, trả về access token mới
- Nếu refresh token cũng hết hạn (sau 7 ngày), yêu cầu đăng nhập lại

**Lưu ý:** API này không cần gửi body, chỉ cần cookie hợp lệ.


**Responses:**

| Code | Mo ta |
| --- | --- |
| `200` | Làm mới token thành công |
| `401` | Không có refresh token trong cookie (REFRESH_TOKEN_MISSING) |
| `403` | Refresh token hết hạn hoặc không hợp lệ (REFRESH_TOKEN_EXPIRED) |

**Response 200 - Vi du:**

```json
{
  "status": "success",
  "message": "Làm mới token thành công",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.newToken...",
    "user": {
      "id": "b2df0d5d-1234-4abc-9def-bbbd02910001",
      "name": "Demo User",
      "email": "demo@junkio.com",
      "role": "member"
    }
  }
}
```

---

### POST `/api/auth/logout`

**Đăng xuất và xóa refresh token**

Xóa refresh token cookie khỏi trình duyệt.
Sau khi gọi API này, access token hiện tại vẫn hoạt động cho đến khi hết hạn,
nhưng không thể làm mới token nữa.

**Lưu ý:** Frontend nên xóa access token khỏi bộ nhớ local sau khi gọi API này.


**Responses:**

| Code | Mo ta |
| --- | --- |
| `200` | Đăng xuất thành công |

**Response 200 - Vi du:**

```json
{
  "status": "success",
  "message": "Đăng xuất thành công"
}
```

---

### POST `/api/auth/forgot-password`

**Gửi email khôi phục mật khẩu**

Gửi email chứa link đặt lại mật khẩu đến địa chỉ email đã đăng ký.
Link khôi phục có hiệu lực trong **10 phút**.

**Quy trình:**
1. Người dùng nhập email
2. Server gửi email chứa token khôi phục
3. Người dùng click link trong email
4. Gọi API `/api/auth/reset-password/{token}` với mật khẩu mới

**Lưu ý:** API luôn trả về thành công để tránh lộ thông tin email nào tồn tại.


**Request Body:**

*Content-Type:* `application/json`

| Truong | Kieu | Bat buoc | Mo ta |
| --- | --- | --- | --- |
| `email` | string | Co | Email đã đăng ký trên hệ thống |

**Vi du:**

```json
{
  "email": "user@junkio.com"
}
```


**Responses:**

| Code | Mo ta |
| --- | --- |
| `200` | Email khôi phục đã được gửi |
| `404` | Email không tồn tại trên hệ thống (EMAIL_NOT_FOUND) |

**Response 200 - Vi du:**

```json
{
  "status": "success",
  "message": "Email khôi phục đã được gửi"
}
```

---

### POST `/api/auth/reset-password/{token}`

**Đặt lại mật khẩu bằng token khôi phục**

Thiết lập mật khẩu mới cho tài khoản sử dụng token nhận được qua email.

**Yêu cầu:**
- Token phải còn hiệu lực (trong vòng 10 phút kể từ khi gửi)
- Mật khẩu mới tối thiểu 6 ký tự
- Mỗi token chỉ sử dụng được **một lần**

Sau khi đặt lại thành công, người dùng cần đăng nhập lại với mật khẩu mới.

**Parameters:**

| Tham so | Vi tri | Mo ta | Bat buoc | Kieu du lieu |
| --- | --- | --- | --- | --- |
| `token` | path | Token khôi phục nhận được qua email (chuỗi hex dài) | Co | string |


**Request Body:**

*Content-Type:* `application/json`

| Truong | Kieu | Bat buoc | Mo ta |
| --- | --- | --- | --- |
| `password` | string | Co | Mật khẩu mới (tối thiểu 6 ký tự) |

**Vi du:**

```json
{
  "password": "newPassword123"
}
```


**Responses:**

| Code | Mo ta |
| --- | --- |
| `200` | Mật khẩu đã được đặt lại thành công |
| `400` | Token không hợp lệ hoặc đã hết hạn (INVALID_RESET_TOKEN) |

**Response 200 - Vi du:**

```json
{
  "status": "success",
  "message": "Mật khẩu đã được đặt lại thành công"
}
```

---

## Budgets

Quản lý ngân sách thu/chi theo danh mục và khoảng thời gian.
Budget giúp người dùng đặt giới hạn chi tiêu cho từng danh mục
(VD: Ăn uống tối đa 3 triệu/tháng). Hỗ trợ cả ngân sách cá nhân và gia đình.

### GET `/api/budgets`

**Lấy danh sách ngân sách mà user có quyền xem**

Trả về toàn bộ ngân sách:
- **Ngân sách cá nhân** của user
- **Ngân sách gia đình** thuộc các family mà user là thành viên

Mỗi budget bao gồm: danh mục, hạn mức, khoảng thời gian, số tiền đã chi.

> Yeu cau xac thuc: `Bearer Token`


**Responses:**

| Code | Mo ta |
| --- | --- |
| `200` | Danh sách ngân sách thành công |

**Response 200 - Vi du:**

```json
{
  "status": "success",
  "message": "Lấy danh sách budget thành công",
  "data": [
    {
      "id": "b1a2b3c4-...",
      "category_id": "c1a2b3c4-...",
      "category_name": "Ăn uống",
      "amount_limit": 3000000,
      "spent": 1850000,
      "start_date": "2026-03-01",
      "end_date": "2026-03-31",
      "family_id": null
    },
    {
      "id": "b2b3c4d5-...",
      "category_id": "c2b3c4d5-...",
      "category_name": "Di chuyển",
      "amount_limit": 5000000,
      "spent": 2100000,
      "start_date": "2026-03-01",
      "end_date": "2026-03-31",
      "family_id": "f1a2b3c4-..."
    }
  ]
}
```

---

### POST `/api/budgets`

**Tạo ngân sách mới**

Tạo một ngân sách mới để giới hạn chi tiêu theo danh mục và thời gian.

**Hướng dẫn:**
- Bỏ qua `family_id` (hoặc gửi null) -> Tạo **ngân sách cá nhân**
- Gửi `family_id` hợp lệ -> Tạo **ngân sách gia đình** (phải là thành viên family đó)

**Ví dụ:** Đặt ngân sách 3 triệu VND cho danh mục "Ăn uống" trong tháng 3/2026.

> Yeu cau xac thuc: `Bearer Token`


**Request Body:**

*Content-Type:* `application/json`

| Truong | Kieu | Bat buoc | Mo ta |
| --- | --- | --- | --- |
| `category_id` | string | Co | UUID của danh mục chi tiêu |
| `amount_limit` | number | Co | Hạn mức chi tiêu (VND) |
| `start_date` | string | Co | Ngày bắt đầu (YYYY-MM-DD) |
| `end_date` | string | Co | Ngày kết thúc (YYYY-MM-DD) |
| `family_id` | string | Khong | UUID gia đình (để null nếu là ngân sách cá nhân) |

**Vi du - Tạo ngân sách cá nhân:**

```json
{
  "category_id": "11111111-1111-1111-1111-111111111111",
  "amount_limit": 3000000,
  "start_date": "2026-03-01",
  "end_date": "2026-03-31"
}
```

**Vi du - Tạo ngân sách gia đình:**

```json
{
  "category_id": "11111111-1111-1111-1111-111111111111",
  "amount_limit": 5000000,
  "start_date": "2026-03-01",
  "end_date": "2026-03-31",
  "family_id": "22222222-2222-2222-2222-222222222222"
}
```


**Responses:**

| Code | Mo ta |
| --- | --- |
| `201` | Tạo ngân sách thành công |
| `403` | User không thuộc gia đình được chỉ định (NOT_FAMILY_MEMBER) |
| `422` | Dữ liệu không hợp lệ |

**Response 201 - Vi du:**

```json
{
  "status": "success",
  "message": "Tạo budget thành công"
}
```

---

### PUT `/api/budgets/{id}`

**Cập nhật ngân sách**

Cập nhật hạn mức, khoảng thời gian hoặc scope của ngân sách.

**Chuyển đổi scope:**
- Gửi `family_id: null` -> Chuyển budget về **cá nhân**
- Gửi `family_id` hợp lệ -> Chuyển sang **gia đình**

Chỉ gửi các field muốn thay đổi (partial update).

> Yeu cau xac thuc: `Bearer Token`

**Parameters:**

| Tham so | Vi tri | Mo ta | Bat buoc | Kieu du lieu |
| --- | --- | --- | --- | --- |
| `id` | path | UUID của ngân sách cần cập nhật | Co | string (uuid) |


**Request Body:**

*Content-Type:* `application/json`

| Truong | Kieu | Bat buoc | Mo ta |
| --- | --- | --- | --- |
| `category_id` | string | Khong |  |
| `amount_limit` | number | Khong |  |
| `start_date` | string | Khong |  |
| `end_date` | string | Khong |  |
| `family_id` | string | Khong |  |

**Vi du:**

```json
{
  "amount_limit": 4000000
}
```


**Responses:**

| Code | Mo ta |
| --- | --- |
| `200` | Cập nhật ngân sách thành công |
| `404` | Không tìm thấy ngân sách (BUDGET_NOT_FOUND) |

**Response 200 - Vi du:**

```json
{
  "status": "success",
  "message": "Cập nhật budget thành công"
}
```

---

### DELETE `/api/budgets/{id}`

**Xóa ngân sách**

Xóa vĩnh viễn một ngân sách. Hành động này không ảnh hưởng đến các giao dịch
đã thực hiện trước đó, chỉ xóa bỏ giới hạn theo dõi chi tiêu.

> Yeu cau xac thuc: `Bearer Token`

**Parameters:**

| Tham so | Vi tri | Mo ta | Bat buoc | Kieu du lieu |
| --- | --- | --- | --- | --- |
| `id` | path | UUID của ngân sách cần xóa | Co | string (uuid) |


**Responses:**

| Code | Mo ta |
| --- | --- |
| `200` | Xóa ngân sách thành công |
| `404` | Không tìm thấy ngân sách (BUDGET_NOT_FOUND) |

**Response 200 - Vi du:**

```json
{
  "status": "success",
  "message": "Xóa budget thành công"
}
```

---

## Categories

Quản lý danh mục thu/chi.
Danh mục dùng để phân loại giao dịch (VD: Ăn uống, Di chuyển, Lương...).
Hỗ trợ danh mục cha-con (parent_id) để tổ chức phân cấp.

### GET `/api/categories`

**Lấy danh sách tất cả danh mục**

Trả về toàn bộ danh mục thu/chi có sẵn trong hệ thống.
Danh mục được chia thành 2 loại:
- **INCOME**: Danh mục thu nhập (VD: Lương, Thưởng, Đầu tư)
- **EXPENSE**: Danh mục chi tiêu (VD: Ăn uống, Di chuyển, Giải trí)

Mỗi danh mục có thể có `parent_id` trỏ đến danh mục cha (cấu trúc cây).

> Yeu cau xac thuc: `Bearer Token`


**Responses:**

| Code | Mo ta |
| --- | --- |
| `200` | Danh sách danh mục thành công |

**Response 200 - Vi du:**

```json
[
  {
    "id": "c1a2b3c4-...",
    "name": "Ăn uống",
    "type": "EXPENSE",
    "icon": "Utensils",
    "parent_id": null
  },
  {
    "id": "c2b3c4d5-...",
    "name": "Cà phê",
    "type": "EXPENSE",
    "icon": "Coffee",
    "parent_id": "c1a2b3c4-..."
  },
  {
    "id": "c3c4d5e6-...",
    "name": "Lương",
    "type": "INCOME",
    "icon": "Banknote",
    "parent_id": null
  }
]
```

---

### POST `/api/categories`

**Tạo danh mục thu/chi mới**

Tạo một danh mục mới để phân loại giao dịch.

**Hướng dẫn:**
- `name`: Tên danh mục (bắt buộc, VD: "Ăn uống", "Lương")
- `type`: INCOME (thu nhập) hoặc EXPENSE (chi tiêu)
- `icon`: Tên icon hiển thị trên giao diện (icon từ thư viện Lucide React)
- `parent_id`: UUID của danh mục cha (để null nếu là danh mục gốc)

> Yeu cau xac thuc: `Bearer Token`


**Request Body:**

*Content-Type:* `application/json`

| Truong | Kieu | Bat buoc | Mo ta |
| --- | --- | --- | --- |
| `name` | string | Co | Tên danh mục |
| `type` | string | Co | Loại danh mục |
| `parent_id` | string | Khong | UUID danh mục cha (để trống nếu là gốc) |
| `icon` | string | Khong | Tên icon Lucide React |

**Vi du - Tạo danh mục gốc (chi tiêu):**

```json
{
  "name": "Giải trí",
  "type": "EXPENSE",
  "icon": "Gamepad2"
}
```

**Vi du - Tạo danh mục con:**

```json
{
  "name": "Xem phim",
  "type": "EXPENSE",
  "icon": "Film",
  "parent_id": "c1a2b3c4-uuid-cua-danh-muc-cha"
}
```


**Responses:**

| Code | Mo ta |
| --- | --- |
| `201` | Tạo danh mục thành công |
| `400` | Dữ liệu không hợp lệ (thiếu name hoặc type) |

**Response 201 - Vi du:**

```json
{
  "status": "success",
  "message": "Tạo danh mục thành công",
  "data": {
    "id": "c-new-category-id",
    "name": "Giải trí",
    "type": "EXPENSE",
    "icon": "Gamepad2",
    "parent_id": null
  }
}
```

---

### PUT `/api/categories/{id}`

**Cập nhật thông tin danh mục**

Thay đổi tên, loại hoặc icon của một danh mục hiện có.
Chỉ gửi các field muốn cập nhật (partial update).

**Lưu ý:** Thay đổi `type` (INCOME <-> EXPENSE) sẽ ảnh hưởng đến
cách hiển thị các giao dịch đã gắn danh mục này.

> Yeu cau xac thuc: `Bearer Token`

**Parameters:**

| Tham so | Vi tri | Mo ta | Bat buoc | Kieu du lieu |
| --- | --- | --- | --- | --- |
| `id` | path | UUID của danh mục cần cập nhật | Co | string (uuid) |


**Request Body:**

*Content-Type:* `application/json`

| Truong | Kieu | Bat buoc | Mo ta |
| --- | --- | --- | --- |
| `name` | string | Khong | Tên mới của danh mục |
| `type` | string | Khong | Loại mới |
| `icon` | string | Khong | Icon mới |

**Vi du:**

```json
{
  "name": "Ăn vặt",
  "icon": "Cookie"
}
```


**Responses:**

| Code | Mo ta |
| --- | --- |
| `200` | Cập nhật danh mục thành công |
| `404` | Không tìm thấy danh mục (CATEGORY_NOT_FOUND) |

**Response 200 - Vi du:**

```json
{
  "status": "success",
  "message": "Cập nhật danh mục thành công"
}
```

---

### DELETE `/api/categories/{id}`

**Xóa danh mục**

Xóa vĩnh viễn một danh mục khỏi hệ thống.

**Lưu ý:** Các giao dịch đã gắn danh mục này sẽ bị mất liên kết
(category_id trở thành null). Nên kiểm tra trước khi xóa.

> Yeu cau xac thuc: `Bearer Token`

**Parameters:**

| Tham so | Vi tri | Mo ta | Bat buoc | Kieu du lieu |
| --- | --- | --- | --- | --- |
| `id` | path | UUID của danh mục cần xóa | Co | string (uuid) |


**Responses:**

| Code | Mo ta |
| --- | --- |
| `200` | Xóa danh mục thành công |
| `404` | Không tìm thấy danh mục (CATEGORY_NOT_FOUND) |

**Response 200 - Vi du:**

```json
{
  "status": "success",
  "message": "Xóa danh mục thành công"
}
```

---

## Debts

Quản lý chia sẻ chi phí và nợ trong nhóm gia đình.
Khi một thành viên gia đình tạo giao dịch chi tiêu chung,
hệ thống tự động chia đều cho các thành viên và tạo khoản nợ.
Mỗi thành viên có thể tất toán khoản nợ của chính mình.

### POST `/api/debts/settle`

**Tất toán nợ qua chuyển khoản nội bộ**

Thanh toán khoản nợ bằng cách chuyển tiền trực tiếp giữa 2 ví trong hệ thống.
Hệ thống sẽ tạo 2 giao dịch (TRANSFER_OUT / TRANSFER_IN) và đánh dấu nợ đã thanh toán.

**Yêu cầu:**
- Ví nguồn (`from_wallet_id`) phải có đủ số dư
- Với settle ngoài family, ví đích (`to_wallet_id`) phải thuộc người nhận thanh toán
- Với settle trong family, backend tự suy ra ví nhận từ các share còn mở

> Yeu cau xac thuc: `Bearer Token`


**Request Body:**

*Content-Type:* `application/json`

| Truong | Kieu | Bat buoc | Mo ta |
| --- | --- | --- | --- |
| `to_user_id` | string | Co | UUID người nhận thanh toán |
| `from_user_id` | string | Khong | Deprecated in family mode; debtor is derived from the authenticated user |
| `amount` | number | Co | Số tiền tất toán (VND) |
| `from_wallet_id` | string | Co | UUID ví người trả (ví của bạn) |
| `to_wallet_id` | string | Khong | UUID ví người nhận. Chỉ bắt buộc ngoài family mode |
| `family_id` | string | Khong | Family id for member-to-member shared expense settlement |

**Vi du:**

```json
{
  "to_user_id": "u-receiver-1234-...",
  "amount": 250000,
  "from_wallet_id": "w-my-wallet-...",
  "to_wallet_id": "w-their-wallet-...",
  "family_id": "family-1234-..."
}
```


**Responses:**

| Code | Mo ta |
| --- | --- |
| `200` | Tất toán nợ thành công |
| `400` | Số dư không đủ hoặc dữ liệu không hợp lệ (INSUFFICIENT_BALANCE) |

**Response 200 - Vi du:**

```json
{
  "status": "success",
  "message": "Tất toán nợ thành công"
}
```

---

### GET `/api/debts/simplified/{familyId}`

**Gợi ý tối ưu thanh toán nợ trong gia đình**

Sử dụng thuật toán Greedy để tính toán cách thanh toán nợ **tối ưu nhất**
giữa các thành viên trong một gia đình. Giảm thiểu số lượng giao dịch cần thực hiện.

**Ví dụ:** Nếu A nợ B 100k, B nợ C 100k -> Gợi ý: A chuyển thẳng cho C 100k
(giảm từ 2 giao dịch xuống 1).

> Yeu cau xac thuc: `Bearer Token`

**Parameters:**

| Tham so | Vi tri | Mo ta | Bat buoc | Kieu du lieu |
| --- | --- | --- | --- | --- |
| `familyId` | path | UUID gia đình cần tối ưu nợ | Co | string (uuid) |


**Responses:**

| Code | Mo ta |
| --- | --- |
| `200` | Danh sách gợi ý thanh toán tối ưu |

**Response 200 - Vi du:**

```json
{
  "status": "success",
  "data": [
    {
      "from": "Nguyễn Văn A",
      "to": "Trần Thị B",
      "amount": 350000
    },
    {
      "from": "Lê Văn C",
      "to": "Trần Thị B",
      "amount": 150000
    }
  ]
}
```

---

## Families

Quản lý nhóm gia đình và thành viên.
Gia đình cho phép nhiều người dùng chia sẻ ví chung, theo dõi chi tiêu chung,
và phân chia nợ trong nhóm.

### GET `/api/families`

**Lấy danh sách gia đình mà tôi tham gia**

Trả về tất cả các nhóm gia đình mà người dùng hiện tại là thành viên
(bao gồm cả gia đình do mình tạo và gia đình được mời vào).

> Yeu cau xac thuc: `Bearer Token`


**Responses:**

| Code | Mo ta |
| --- | --- |
| `200` | Danh sách gia đình thành công |

**Response 200 - Vi du:**

```json
[
  {
    "id": "f1a2b3c4-...",
    "name": "Gia đình Nguyễn",
    "created_by": "b2df0d5d-..."
  },
  {
    "id": "f2b3c4d5-...",
    "name": "Nhóm bạn thân",
    "created_by": "c3ef1e6e-..."
  }
]
```

---

### POST `/api/families`

**Tạo nhóm gia đình mới**

Tạo một nhóm gia đình mới. Người tạo tự động trở thành **ADMIN** của gia đình.
Sau khi tạo, có thể mời thêm thành viên bằng email qua API thêm thành viên.

> Yeu cau xac thuc: `Bearer Token`


**Request Body:**

*Content-Type:* `application/json`

| Truong | Kieu | Bat buoc | Mo ta |
| --- | --- | --- | --- |
| `name` | string | Co | Tên nhóm gia đình |

**Vi du:**

```json
{
  "name": "Gia đình Nguyễn"
}
```


**Responses:**

| Code | Mo ta |
| --- | --- |
| `201` | Tạo gia đình thành công |
| `400` | Dữ liệu không hợp lệ (thiếu tên) |

**Response 201 - Vi du:**

```json
{
  "status": "success",
  "message": "Tạo gia đình thành công",
  "data": {
    "id": "f-new-family-id",
    "name": "Gia đình Nguyễn",
    "created_by": "b2df0d5d-..."
  }
}
```

---

### GET `/api/families/{id}`

**Xem chi tiết gia đình và danh sách thành viên**

Trả về thông tin chi tiết của một gia đình, bao gồm:
- Tên gia đình, người tạo
- Danh sách tất cả thành viên (tên, email, vai trò trong gia đình)

Chỉ thành viên của gia đình mới có quyền xem.

> Yeu cau xac thuc: `Bearer Token`

**Parameters:**

| Tham so | Vi tri | Mo ta | Bat buoc | Kieu du lieu |
| --- | --- | --- | --- | --- |
| `id` | path | UUID của gia đình | Co | string (uuid) |


**Responses:**

| Code | Mo ta |
| --- | --- |
| `200` | Chi tiết gia đình thành công |
| `404` | Gia đình không tồn tại (FAMILY_NOT_FOUND) |

**Response 200 - Vi du:**

```json
{
  "status": "success",
  "data": {
    "id": "f1a2b3c4-...",
    "name": "Gia đình Nguyễn",
    "created_by": "b2df0d5d-...",
    "members": [
      {
        "id": "b2df0d5d-...",
        "name": "Nguyễn Văn A",
        "email": "nguyenvana@junkio.com",
        "role": "ADMIN"
      },
      {
        "id": "c3ef1e6e-...",
        "name": "Nguyễn Thị B",
        "email": "nguyenthib@junkio.com",
        "role": "MEMBER"
      }
    ]
  }
}
```

---

### DELETE `/api/families/{id}`

**Xóa gia đình vĩnh viễn**

Xóa hoàn toàn nhóm gia đình và tất cả dữ liệu liên quan.
Hành động này **không thể hoàn tác**.

**Chỉ người tạo (owner)** gia đình mới có quyền xóa.
Ví gia đình, giao dịch chung, ngân sách gia đình sẽ bị xóa theo.

> Yeu cau xac thuc: `Bearer Token`

**Parameters:**

| Tham so | Vi tri | Mo ta | Bat buoc | Kieu du lieu |
| --- | --- | --- | --- | --- |
| `id` | path | UUID của gia đình cần xóa | Co | string (uuid) |


**Responses:**

| Code | Mo ta |
| --- | --- |
| `200` | Xóa gia đình thành công |
| `403` | Chỉ người tạo mới có quyền xóa (NOT_FAMILY_OWNER) |
| `404` | Gia đình không tồn tại (FAMILY_NOT_FOUND) |

**Response 200 - Vi du:**

```json
{
  "status": "success",
  "message": "Xóa gia đình thành công"
}
```

---

### POST `/api/families/{id}/members`

**Thêm thành viên vào gia đình bằng email**

Mời một người dùng khác vào gia đình bằng địa chỉ email.

**Yêu cầu:**
- Email phải thuộc về một tài khoản Junkio đã đăng ký
- Người được mời chưa là thành viên của gia đình này
- Người mời phải là ADMIN của gia đình

**Vai trò trong gia đình:**
- `ADMIN`: Có quyền quản lý thành viên, xóa gia đình
- `MEMBER`: Thành viên thường, có quyền xem/tạo giao dịch chung

> Yeu cau xac thuc: `Bearer Token`

**Parameters:**

| Tham so | Vi tri | Mo ta | Bat buoc | Kieu du lieu |
| --- | --- | --- | --- | --- |
| `id` | path | UUID của gia đình | Co | string (uuid) |


**Request Body:**

*Content-Type:* `application/json`

| Truong | Kieu | Bat buoc | Mo ta |
| --- | --- | --- | --- |
| `email` | string | Co | Email của người muốn mời |
| `role` | string | Khong | Vai trò trong gia đình |

**Vi du:**

```json
{
  "email": "member@junkio.com",
  "role": "MEMBER"
}
```


**Responses:**

| Code | Mo ta |
| --- | --- |
| `200` | Thêm thành viên thành công |
| `404` | Gia đình hoặc user không tồn tại |
| `409` | User đã là thành viên của gia đình (MEMBER_EXISTS) |

**Response 200 - Vi du:**

```json
{
  "status": "success",
  "message": "Thêm thành viên thành công"
}
```

---

### DELETE `/api/families/{id}/members/{userIdToRemove}`

**Xóa thành viên khỏi gia đình**

Xóa một thành viên ra khỏi nhóm gia đình.

**Quy tắc:**
- Chỉ ADMIN gia đình mới có quyền xóa thành viên khác
- Thành viên có thể tự rời gia đình bằng cách gửi `userIdToRemove` = chính mình
- Không thể xóa người tạo (owner) ra khỏi gia đình

> Yeu cau xac thuc: `Bearer Token`

**Parameters:**

| Tham so | Vi tri | Mo ta | Bat buoc | Kieu du lieu |
| --- | --- | --- | --- | --- |
| `id` | path | UUID của gia đình | Co | string (uuid) |
| `userIdToRemove` | path | UUID user cần xóa khỏi gia đình | Co | string (uuid) |


**Responses:**

| Code | Mo ta |
| --- | --- |
| `200` | Xóa thành viên thành công |
| `403` | Chỉ admin gia đình mới có quyền xóa |
| `404` | Thành viên không tồn tại trong gia đình |

**Response 200 - Vi du:**

```json
{
  "status": "success",
  "message": "Xóa thành viên thành công"
}
```

---

## Forecast

Forecast cashflow trends from the user's historical transactions.

### GET `/api/forecast`

**Load the standard forecast dataset**

Returns historical monthly income/expense totals plus forward-looking predictions.

> Yeu cau xac thuc: `Bearer Token`

**Parameters:**

| Tham so | Vi tri | Mo ta | Bat buoc | Kieu du lieu |
| --- | --- | --- | --- | --- |
| `months` | query | Number of future months to forecast | Khong | integer [mac dinh: 3] |


**Responses:**

| Code | Mo ta |
| --- | --- |
| `200` | Forecast loaded successfully |

---

### GET `/api/forecast/ml`

**Load the AI/ML forecast dataset**

Uses simple linear regression on the last 6 months of transaction history.

> Yeu cau xac thuc: `Bearer Token`

**Parameters:**

| Tham so | Vi tri | Mo ta | Bat buoc | Kieu du lieu |
| --- | --- | --- | --- | --- |
| `months` | query | Number of future months to forecast | Khong | integer [mac dinh: 3] |


**Responses:**

| Code | Mo ta |
| --- | --- |
| `200` | ML forecast loaded successfully |

**Response 200 - Vi du:**

```json
{
  "status": "success",
  "message": "FORECAST_ML_RETRIEVED",
  "data": {
    "historical": [
      {
        "month": "2026-01",
        "income": 28000000,
        "expense": 18500000
      }
    ],
    "forecast": [
      {
        "month": "2026-07",
        "predictedIncome": 29000000,
        "predictedExpense": 19500000,
        "predictedNet": 9500000
      }
    ],
    "warningMonth": null,
    "model": {
      "type": "SIMPLE_LINEAR_REGRESSION",
      "sourceMonths": 6,
      "forecastMonths": 3
    }
  }
}
```

---

## Goals

Quản lý mục tiêu tài chính (tiết kiệm).
Mục tiêu giúp người dùng theo dõi tiến độ tiết kiệm cho một mục đích cụ thể
(VD: mua laptop, du lịch, quỹ khẩn cấp...).
Người dùng có thể nạp tiền từ ví cá nhân vào mục tiêu.

### GET `/api/goals`

**Lấy danh sách mục tiêu tài chính**

Trả về tất cả mục tiêu của người dùng hiện tại,
bao gồm cả mục tiêu cá nhân và mục tiêu gia đình (nếu có).
Mỗi mục tiêu hiển thị: tên, số tiền mục tiêu, số tiền đã nạp, trạng thái, deadline.

> Yeu cau xac thuc: `Bearer Token`


**Responses:**

| Code | Mo ta |
| --- | --- |
| `200` | Danh sách mục tiêu thành công |

**Response 200 - Vi du:**

```json
{
  "status": "success",
  "message": "Lấy danh sách mục tiêu thành công",
  "data": [
    {
      "id": "g1a2b3c4-...",
      "name": "Mua laptop mới",
      "targetAmount": 30000000,
      "currentAmount": 12000000,
      "status": "IN_PROGRESS",
      "deadline": "2026-12-31",
      "colorCode": "#16a34a"
    },
    {
      "id": "g2b3c4d5-...",
      "name": "Du lịch Đà Lạt",
      "targetAmount": 10000000,
      "currentAmount": 10000000,
      "status": "ACHIEVED",
      "deadline": "2026-06-01",
      "colorCode": "#2563eb"
    }
  ]
}
```

---

### POST `/api/goals`

**Tạo mục tiêu tiết kiệm mới**

Tạo một mục tiêu tài chính mới để theo dõi tiến độ tiết kiệm.

**Các trường:**
- `name`: Tên mục tiêu (bắt buộc)
- `targetAmount`: Số tiền mục tiêu cần đạt (bắt buộc, > 0)
- `deadline`: Hạn chót (tùy chọn, định dạng YYYY-MM-DD)
- `colorCode`: Mã màu hex hiển thị trên giao diện
- `imageUrl`: Tên icon đại diện cho mục tiêu

> Yeu cau xac thuc: `Bearer Token`


**Request Body:**

*Content-Type:* `application/json`

| Truong | Kieu | Bat buoc | Mo ta |
| --- | --- | --- | --- |
| `name` | string | Co | Tên mục tiêu |
| `targetAmount` | number | Co | Số tiền mục tiêu (VND) |
| `deadline` | string | Khong | Hạn chót (tùy chọn) |
| `colorCode` | string | Khong | Mã màu hex |
| `imageUrl` | string | Khong | Tên icon |

**Vi du:**

```json
{
  "name": "Mua laptop mới",
  "targetAmount": 30000000,
  "deadline": "2026-12-31",
  "colorCode": "#16a34a",
  "imageUrl": "Laptop"
}
```


**Responses:**

| Code | Mo ta |
| --- | --- |
| `201` | Tạo mục tiêu thành công |
| `422` | Dữ liệu không hợp lệ (thiếu name hoặc targetAmount <= 0) |

**Response 201 - Vi du:**

```json
{
  "status": "success",
  "message": "Tạo mục tiêu thành công",
  "data": {
    "id": "g-new-goal-id",
    "name": "Mua laptop mới",
    "targetAmount": 30000000,
    "currentAmount": 0,
    "status": "IN_PROGRESS"
  }
}
```

---

### PUT `/api/goals/{id}`

**Cập nhật thông tin mục tiêu**

Thay đổi tên, số tiền mục tiêu, deadline hoặc trạng thái của một mục tiêu.
Chỉ gửi các field muốn cập nhật (partial update).

**Trạng thái hợp lệ:**
- `IN_PROGRESS`: Đang thực hiện
- `ACHIEVED`: Đã hoàn thành (người dùng tự đánh dấu hoặc hệ thống tự chuyển khi đạt mục tiêu)

> Yeu cau xac thuc: `Bearer Token`

**Parameters:**

| Tham so | Vi tri | Mo ta | Bat buoc | Kieu du lieu |
| --- | --- | --- | --- | --- |
| `id` | path | UUID của mục tiêu | Co | string (uuid) |


**Request Body:**

*Content-Type:* `application/json`

| Truong | Kieu | Bat buoc | Mo ta |
| --- | --- | --- | --- |
| `name` | string | Khong |  |
| `targetAmount` | number | Khong |  |
| `deadline` | string | Khong |  |
| `colorCode` | string | Khong |  |
| `imageUrl` | string | Khong |  |
| `status` | string | Khong |  |

**Vi du:**

```json
{
  "name": "Mua MacBook Pro M4",
  "targetAmount": 45000000
}
```


**Responses:**

| Code | Mo ta |
| --- | --- |
| `200` | Cập nhật mục tiêu thành công |
| `404` | Không tìm thấy mục tiêu (GOAL_NOT_FOUND) |

**Response 200 - Vi du:**

```json
{
  "status": "success",
  "message": "Cập nhật mục tiêu thành công"
}
```

---

### DELETE `/api/goals/{id}`

**Xóa mục tiêu tiết kiệm**

Xóa vĩnh viễn một mục tiêu. Hành động này không thể hoàn tác.

**Lưu ý:** Số tiền đã nạp vào mục tiêu sẽ **không** được hoàn lại tự động.
Nếu muốn lấy lại tiền, hãy rút trước khi xóa.

> Yeu cau xac thuc: `Bearer Token`

**Parameters:**

| Tham so | Vi tri | Mo ta | Bat buoc | Kieu du lieu |
| --- | --- | --- | --- | --- |
| `id` | path | UUID của mục tiêu cần xóa | Co | string (uuid) |


**Responses:**

| Code | Mo ta |
| --- | --- |
| `200` | Xóa mục tiêu thành công |
| `404` | Không tìm thấy mục tiêu (GOAL_NOT_FOUND) |

**Response 200 - Vi du:**

```json
{
  "status": "success",
  "message": "Xóa mục tiêu thành công"
}
```

---

### POST `/api/goals/{id}/deposit`

**Nạp tiền vào mục tiêu từ ví cá nhân**

Chuyển một khoản tiền từ ví cá nhân vào mục tiêu tiết kiệm.

**Quy tắc:**
- `wallet_id` phải là ví cá nhân của chính user (không dùng ví gia đình)
- Số dư ví phải đủ để nạp
- Sau khi nạp, số dư ví sẽ bị trừ và `currentAmount` của mục tiêu tăng lên
- Nếu `currentAmount >= targetAmount`, trạng thái tự động chuyển sang ACHIEVED

> Yeu cau xac thuc: `Bearer Token`

**Parameters:**

| Tham so | Vi tri | Mo ta | Bat buoc | Kieu du lieu |
| --- | --- | --- | --- | --- |
| `id` | path | UUID của mục tiêu cần nạp | Co | string (uuid) |


**Request Body:**

*Content-Type:* `application/json`

| Truong | Kieu | Bat buoc | Mo ta |
| --- | --- | --- | --- |
| `amount` | number | Co | Số tiền muốn nạp (VND) |
| `wallet_id` | string | Co | UUID ví cá nhân nguồn tiền |

**Vi du:**

```json
{
  "amount": 5000000,
  "wallet_id": "11111111-1111-1111-1111-111111111111"
}
```


**Responses:**

| Code | Mo ta |
| --- | --- |
| `200` | Nạp tiền vào mục tiêu thành công |
| `403` | Ví không phải ví cá nhân hợp lệ (INVALID_WALLET) |
| `404` | Mục tiêu không tồn tại (GOAL_NOT_FOUND) |

**Response 200 - Vi du:**

```json
{
  "status": "success",
  "message": "Nạp tiền vào mục tiêu thành công",
  "data": {
    "id": "g1a2b3c4-...",
    "currentAmount": 17000000,
    "status": "IN_PROGRESS",
    "sourceWallet": {
      "id": "11111111-...",
      "balance": 8000000
    }
  }
}
```

---

## Market

Market data widgets and integrations for the authenticated dashboard.

### GET `/api/market/gold`

**Load the latest live SJC gold price for the dashboard widget**

Proxies the live SJC price service, normalizes the selected Ho Chi Minh City SJC record, and caches it in Redis for 60 seconds.

> Yeu cau xac thuc: `Bearer Token`


**Responses:**

| Code | Mo ta |
| --- | --- |
| `200` | Gold price loaded successfully |
| `502` | Upstream gold price service failed |

---

### GET `/api/market/gold/history`

**Load the cached SJC gold price history for the dashboard chart**

Returns the locally stored SJC history for the selected range. Live snapshots take precedence over demo-seeded points at the same timestamp.

> Yeu cau xac thuc: `Bearer Token`

**Parameters:**

| Tham so | Vi tri | Mo ta | Bat buoc | Kieu du lieu |
| --- | --- | --- | --- | --- |
| `range` | query |  | Co | string (24H, 7D) |


**Responses:**

| Code | Mo ta |
| --- | --- |
| `200` | Gold price history loaded successfully |
| `400` | Invalid history range |
| `500` | Gold price history failed to load |

---

## Notifications

Quản lý thông báo hệ thống.
Hệ thống tự động gửi thông báo khi có sự kiện quan trọng:
vượt ngân sách, mục tiêu đạt được, khoản chia tiền mới, broadcast từ admin...

### GET `/api/notifications`

**Lấy danh sách thông báo của tôi**

Trả về tối đa **50 thông báo** mới nhất của người dùng hiện tại.
Mỗi thông báo bao gồm: loại, nội dung, trạng thái đã đọc, thời gian.

Frontend dùng API này để hiển thị badge số thông báo chưa đọc và danh sách popup.

> Yeu cau xac thuc: `Bearer Token`


**Responses:**

| Code | Mo ta |
| --- | --- |
| `200` | Danh sách thông báo |

**Response 200 - Vi du:**

```json
[
  {
    "id": "n1a2b3c4-...",
    "type": "BUDGET_WARNING",
    "message": "Bạn đã chi 85% ngân sách Ăn uống tháng này",
    "isRead": false,
    "created_at": "2026-03-30T08:00:00.000Z"
  },
  {
    "id": "n2b3c4d5-...",
    "type": "GOAL_ACHIEVED",
    "message": "Chúc mừng! Mục tiêu Mua laptop đã hoàn thành",
    "isRead": true,
    "created_at": "2026-03-29T15:30:00.000Z"
  }
]
```

---

### PUT `/api/notifications/read-all`

**Đánh dấu tất cả thông báo đã đọc**

Đánh dấu toàn bộ thông báo chưa đọc thành đã đọc.
Thường được gọi khi người dùng mở dropdown thông báo.

> Yeu cau xac thuc: `Bearer Token`


**Responses:**

| Code | Mo ta |
| --- | --- |
| `200` | Đánh dấu tất cả đã đọc thành công |

**Response 200 - Vi du:**

```json
{
  "msg": "All notifications marked as read"
}
```

---

### PUT `/api/notifications/{id}/read`

**Đánh dấu một thông báo cụ thể đã đọc**

Đánh dấu một thông báo đã đọc theo UUID.
Chỉ có thể đánh dấu thông báo thuộc về chính mình.

> Yeu cau xac thuc: `Bearer Token`

**Parameters:**

| Tham so | Vi tri | Mo ta | Bat buoc | Kieu du lieu |
| --- | --- | --- | --- | --- |
| `id` | path | UUID của thông báo | Co | string (uuid) |


**Responses:**

| Code | Mo ta |
| --- | --- |
| `200` | Đánh dấu đã đọc thành công |
| `404` | Không tìm thấy thông báo (NOTIFICATION_NOT_FOUND) |

**Response 200 - Vi du:**

```json
{
  "status": "success",
  "message": "Đã đánh dấu đã đọc"
}
```

---

### POST `/api/notifications/broadcast`

**Gửi thông báo broadcast tới tất cả user (chỉ admin)**

Gửi một thông báo đến **toàn bộ** người dùng trên hệ thống.
Chỉ tài khoản có quyền **admin** mới được phép sử dụng.

Hữu ích cho: thông báo bảo trì, cập nhật tính năng mới, cảnh báo hệ thống.

> Yeu cau xac thuc: `Bearer Token`


**Request Body:**

*Content-Type:* `application/json`

| Truong | Kieu | Bat buoc | Mo ta |
| --- | --- | --- | --- |
| `message` | string | Co | Nội dung thông báo |
| `type` | string | Khong | Loại thông báo (mặc định SYSTEM) |

**Vi du:**

```json
{
  "message": "Hệ thống sẽ bảo trì vào 22:00 tối nay. Vui lòng lưu dữ liệu.",
  "type": "SYSTEM"
}
```


**Responses:**

| Code | Mo ta |
| --- | --- |
| `200` | Đã gửi broadcast thành công |
| `403` | Chỉ admin mới có quyền gửi broadcast |

**Response 200 - Vi du:**

```json
{
  "status": "success",
  "message": "Đã gửi broadcast tới tất cả user"
}
```

---

## Recurring

Quản lý giao dịch định kỳ (tự động lặp lại).
Cho phép người dùng thiết lập mẫu giao dịch tự động tạo theo chu kỳ:
hàng ngày, hàng tuần, hàng tháng hoặc hàng năm.
VD: Tiền điện hàng tháng, lương hàng tháng, tiền thuê nhà...

### GET `/api/recurring`

**Lấy danh sách mẫu giao dịch định kỳ**

Trả về tất cả mẫu giao dịch định kỳ của người dùng hiện tại.
Mỗi mẫu hiển thị: số tiền, tần suất, ngày chạy tiếp theo, trạng thái hoạt động.

> Yeu cau xac thuc: `Bearer Token`


**Responses:**

| Code | Mo ta |
| --- | --- |
| `200` | Danh sách giao dịch định kỳ thành công |

**Response 200 - Vi du:**

```json
[
  {
    "id": "r1a2b3c4-...",
    "amount": 300000,
    "type": "EXPENSE",
    "description": "Tiền điện hàng tháng",
    "frequency": "MONTHLY",
    "next_run_date": "2026-04-01",
    "is_active": true
  },
  {
    "id": "r2b3c4d5-...",
    "amount": 25000000,
    "type": "INCOME",
    "description": "Lương tháng",
    "frequency": "MONTHLY",
    "next_run_date": "2026-04-28",
    "is_active": true
  }
]
```

---

### POST `/api/recurring`

**Tạo mẫu giao dịch định kỳ mới**

Thiết lập một giao dịch tự động lặp lại theo chu kỳ.

**Tần suất hỗ trợ:**
- `DAILY`: Hàng ngày
- `WEEKLY`: Hàng tuần
- `MONTHLY`: Hàng tháng (phổ biến nhất)
- `YEARLY`: Hàng năm

Hệ thống sẽ tự động tạo giao dịch vào `next_run_date` và cập nhật ngày chạy tiếp theo.

> Yeu cau xac thuc: `Bearer Token`


**Request Body:**

*Content-Type:* `application/json`

| Truong | Kieu | Bat buoc | Mo ta |
| --- | --- | --- | --- |
| `wallet_id` | string | Co | UUID ví thực hiện giao dịch |
| `category_id` | string | Khong | UUID danh mục (tùy chọn) |
| `amount` | number | Co | Số tiền mỗi lần (VND) |
| `type` | string | Khong | Loại giao dịch |
| `description` | string | Khong | Mô tả giao dịch |
| `frequency` | string | Co | Tần suất lặp lại |
| `next_run_date` | string | Co | Ngày chạy tiếp theo (YYYY-MM-DD) |

**Vi du:**

```json
{
  "wallet_id": "w1a2b3c4-...",
  "amount": 300000,
  "type": "EXPENSE",
  "description": "Tiền điện hàng tháng",
  "frequency": "MONTHLY",
  "next_run_date": "2026-04-01"
}
```


**Responses:**

| Code | Mo ta |
| --- | --- |
| `201` | Tạo mẫu định kỳ thành công |
| `400` | Thiếu trường bắt buộc hoặc dữ liệu không hợp lệ |

**Response 201 - Vi du:**

```json
{
  "status": "success",
  "message": "Tạo giao dịch định kỳ thành công"
}
```

---

### POST `/api/recurring/trigger-cron`

**Kích hoạt xử lý giao dịch định kỳ ngay lập tức**

Chạy ngay lập tức job cron xử lý các giao dịch định kỳ đến hạn.
API này thường được gọi tự động bởi hệ thống cron,
nhưng cũng có thể kích hoạt thủ công để debug hoặc test.

Job sẽ quét tất cả mẫu có `is_active = true` và `next_run_date <= today`,
tạo giao dịch tương ứng và cập nhật `next_run_date` cho chu kỳ tiếp theo.

> Yeu cau xac thuc: `Bearer Token`


**Responses:**

| Code | Mo ta |
| --- | --- |
| `200` | Kết quả chạy cron |

**Response 200 - Vi du:**

```json
{
  "message": "Đã chạy thành công 3 giao dịch định kỳ."
}
```

---

### PUT `/api/recurring/{id}`

**Cập nhật mẫu giao dịch định kỳ**

Thay đổi số tiền, tần suất, trạng thái hoặc ngày chạy của một mẫu định kỳ.
Chỉ gửi các field muốn cập nhật.

**Tạm dừng:** Gửi `is_active: false` để tạm ngừng (không xóa).

> Yeu cau xac thuc: `Bearer Token`

**Parameters:**

| Tham so | Vi tri | Mo ta | Bat buoc | Kieu du lieu |
| --- | --- | --- | --- | --- |
| `id` | path | UUID của mẫu định kỳ | Co | string (uuid) |


**Request Body:**

*Content-Type:* `application/json`

| Truong | Kieu | Bat buoc | Mo ta |
| --- | --- | --- | --- |
| `amount` | number | Khong |  |
| `frequency` | string | Khong |  |
| `is_active` | boolean | Khong |  |
| `next_run_date` | string | Khong |  |
| `description` | string | Khong |  |

**Vi du:**

```json
{
  "amount": 350000,
  "description": "Tiền điện (đã tăng)"
}
```


**Responses:**

| Code | Mo ta |
| --- | --- |
| `200` | Cập nhật thành công |
| `404` | Không tìm thấy mẫu định kỳ (RECURRING_NOT_FOUND) |

**Response 200 - Vi du:**

```json
{
  "status": "success",
  "message": "Cập nhật giao dịch định kỳ thành công"
}
```

---

### DELETE `/api/recurring/{id}`

**Xóa mẫu giao dịch định kỳ**

Xóa vĩnh viễn một mẫu giao dịch định kỳ.
Các giao dịch đã tạo trước đó **không bị ảnh hưởng** (vẫn được lưu).
Chỉ ngừng tạo giao dịch mới trong tương lai.

> Yeu cau xac thuc: `Bearer Token`

**Parameters:**

| Tham so | Vi tri | Mo ta | Bat buoc | Kieu du lieu |
| --- | --- | --- | --- | --- |
| `id` | path | UUID của mẫu định kỳ cần xóa | Co | string (uuid) |


**Responses:**

| Code | Mo ta |
| --- | --- |
| `200` | Xóa thành công |
| `404` | Không tìm thấy mẫu định kỳ (RECURRING_NOT_FOUND) |

**Response 200 - Vi du:**

```json
{
  "status": "success",
  "message": "Xóa giao dịch định kỳ thành công"
}
```

---

## Transactions

Quản lý giao dịch thu chi, chuyển tiền, nhập và xuất dữ liệu.
Đây là nhóm API trọng tâm của hệ thống, cho phép người dùng:
- Ghi nhận thu nhập / chi tiêu hàng ngày
- Chuyển tiền giữa các ví
- Nhập hàng loạt giao dịch từ file
- Xuất dữ liệu ra CSV/PDF

### GET `/api/transactions`

**Lấy danh sách giao dịch có phân trang và bộ lọc**

Trả về danh sách giao dịch của người dùng hiện tại, hỗ trợ nhiều bộ lọc:
- **Context**: Xem giao dịch cá nhân (`personal`) hoặc gia đình (`family`)
- **Loại giao dịch**: INCOME, EXPENSE, TRANSFER_IN, TRANSFER_OUT
- **Khoảng thời gian**: Lọc theo ngày bắt đầu / kết thúc
- **Ví cụ thể**: Lọc theo wallet_id
- **Danh mục**: Lọc theo category_id
- **Tìm kiếm**: Tìm theo mô tả giao dịch

Kết quả có phân trang, mặc định 10 bản ghi mỗi trang.

> Yeu cau xac thuc: `Bearer Token`

**Parameters:**

| Tham so | Vi tri | Mo ta | Bat buoc | Kieu du lieu |
| --- | --- | --- | --- | --- |
| `context` | query | Chọn ngữ cảnh dữ liệu cần xem (cá nhân hoặc gia đình) | Khong | string (personal, family) |
| `family_id` | query | ID gia đình (bắt buộc khi context = family) | Khong | string (uuid) |
| `page` | query | Số trang hiện tại (bắt đầu từ 1) | Khong | integer [mac dinh: 1] |
| `limit` | query | Số giao dịch mỗi trang | Khong | integer [mac dinh: 10] |
| `type` | query | Lọc theo loại giao dịch | Khong | string (INCOME, EXPENSE, TRANSFER_IN, TRANSFER_OUT) |
| `startDate` | query | Ngày bắt đầu lọc (YYYY-MM-DD) | Khong | string (date) |
| `endDate` | query | Ngày kết thúc lọc (YYYY-MM-DD) | Khong | string (date) |
| `wallet_id` | query | Lọc theo ID ví cụ thể | Khong | string (uuid) |
| `category_id` | query | Lọc theo danh mục thu/chi | Khong | string (uuid) |
| `search` | query | Tìm kiếm theo từ khóa trong mô tả giao dịch | Khong | string |


**Responses:**

| Code | Mo ta |
| --- | --- |
| `200` | Danh sách giao dịch thành công |

**Response 200 - Vi du:**

```json
{
  "status": "success",
  "message": "Lấy danh sách giao dịch thành công",
  "data": {
    "transactions": [
      {
        "id": "t1a2b3c4-5678-9abc-def0-123456789001",
        "amount": 150000,
        "type": "EXPENSE",
        "description": "Cà phê buổi sáng",
        "date": "2026-03-30",
        "wallet_id": "w1a2b3c4-...",
        "category_id": "c1a2b3c4-..."
      },
      {
        "id": "t1a2b3c4-5678-9abc-def0-123456789002",
        "amount": 25000000,
        "type": "INCOME",
        "description": "Lương tháng 3",
        "date": "2026-03-28",
        "wallet_id": "w1a2b3c4-...",
        "category_id": null
      }
    ],
    "totalItems": 342,
    "totalPages": 35,
    "currentPage": 1
  }
}
```

---

### POST `/api/transactions`

**Tạo giao dịch mới (thu nhập hoặc chi tiêu)**

Ghi nhận một giao dịch thu nhập hoặc chi tiêu mới vào ví.

**Yêu cầu:**
- Phải có ít nhất một ví hợp lệ trước khi tạo giao dịch
- `wallet_id` phải là ví mà bạn sở hữu hoặc có quyền truy cập (ví gia đình)
- Khi tạo giao dịch EXPENSE, số dư ví phải đủ

**Luồng xử lý:**
- INCOME: Tự động cộng `amount` vào số dư ví
- EXPENSE: Tự động trừ `amount` khỏi số dư ví

> Yeu cau xac thuc: `Bearer Token`


**Request Body:**

*Content-Type:* `application/json`

| Truong | Kieu | Bat buoc | Mo ta |
| --- | --- | --- | --- |
| `wallet_id` | string | Co | ID ví thực hiện giao dịch |
| `amount` | number | Co | Số tiền giao dịch (phải lớn hơn 0) |
| `type` | string | Co | Loại giao dịch |
| `description` | string | Khong | Mô tả giao dịch (tùy chọn) |
| `category_id` | string | Khong | ID danh mục (tùy chọn) |
| `date` | string | Co | Ngày giao dịch (YYYY-MM-DD) |

**Vi du - Ghi nhận chi tiêu:**

```json
{
  "wallet_id": "w1a2b3c4-5678-9abc-def0-123456789001",
  "amount": 150000,
  "type": "EXPENSE",
  "description": "Cà phê buổi sáng",
  "date": "2026-03-30"
}
```

**Vi du - Ghi nhận thu nhập:**

```json
{
  "wallet_id": "w1a2b3c4-5678-9abc-def0-123456789001",
  "amount": 25000000,
  "type": "INCOME",
  "description": "Lương tháng 3/2026",
  "date": "2026-03-28"
}
```


**Responses:**

| Code | Mo ta |
| --- | --- |
| `201` | Tạo giao dịch thành công |
| `400` | Chưa có ví hoặc số dư không đủ (INSUFFICIENT_BALANCE) |
| `422` | Dữ liệu body không hợp lệ |

**Response 201 - Vi du:**

```json
{
  "status": "success",
  "message": "Tạo giao dịch thành công",
  "data": {
    "id": "t1a2b3c4-new-transaction-id",
    "amount": 150000,
    "type": "EXPENSE",
    "description": "Cà phê buổi sáng",
    "wallet_balance": 9850000
  }
}
```

---

### POST `/api/transactions/transfer`

**Chuyển tiền giữa hai ví**

Thực hiện chuyển tiền từ ví nguồn sang ví đích.
Hệ thống tự động tạo 2 giao dịch liên kết:
- **TRANSFER_OUT** trên ví nguồn (trừ tiền)
- **TRANSFER_IN** trên ví đích (cộng tiền)

Cả hai ví phải thuộc quyền quản lý của user (ví cá nhân hoặc ví gia đình).
Hai giao dịch được liên kết bằng `transfer_group_id` để dễ truy vết.

> Yeu cau xac thuc: `Bearer Token`


**Request Body:**

*Content-Type:* `application/json`

| Truong | Kieu | Bat buoc | Mo ta |
| --- | --- | --- | --- |
| `from_wallet_id` | string | Co | ID ví nguồn (trừ tiền) |
| `to_wallet_id` | string | Co | ID ví đích (cộng tiền) |
| `amount` | number | Co | Số tiền chuyển (phải nhỏ hơn hoặc bằng số dư ví nguồn) |
| `description` | string | Khong | Ghi chú chuyển khoản |
| `date` | string | Khong | Ngày chuyển khoản |

**Vi du:**

```json
{
  "from_wallet_id": "w-source-1234-...",
  "to_wallet_id": "w-dest-5678-...",
  "amount": 5000000,
  "description": "Chuyển sang ví tiết kiệm"
}
```


**Responses:**

| Code | Mo ta |
| --- | --- |
| `201` | Chuyển tiền thành công |
| `400` | Ví không hợp lệ hoặc số dư không đủ (INSUFFICIENT_BALANCE) |

**Response 201 - Vi du:**

```json
{
  "status": "success",
  "message": "Chuyển tiền thành công",
  "data": {
    "transfer_group_id": "tg-a1b2c3d4-...",
    "transfer_out_id": "t-out-5678-...",
    "transfer_in_id": "t-in-9012-...",
    "from_wallet_balance": 5000000,
    "to_wallet_balance": 15000000
  }
}
```

---

### POST `/api/transactions/import`

**Nhập hàng loạt giao dịch (Bulk Import)**

Cho phép nhập nhiều giao dịch cùng lúc trong một request.
Hữu ích khi:
- Chuyển dữ liệu từ ứng dụng khác sang Junkio
- Nhập dữ liệu từ file Excel/CSV đã parse
- Tự động hóa việc ghi nhận giao dịch

**Lưu ý:** Mỗi giao dịch trong mảng sẽ được xử lý độc lập.
Nếu một giao dịch lỗi, các giao dịch khác vẫn được tạo thành công.

> Yeu cau xac thuc: `Bearer Token`


**Request Body:**

*Content-Type:* `application/json`

| Truong | Kieu | Bat buoc | Mo ta |
| --- | --- | --- | --- |
| `transactions` | array | Co |  |

**Vi du:**

```json
{
  "transactions": [
    {
      "wallet_id": "w1a2b3c4-...",
      "amount": 50000,
      "type": "EXPENSE",
      "description": "Grab đi làm",
      "date": "2026-03-28"
    },
    {
      "wallet_id": "w1a2b3c4-...",
      "amount": 200000,
      "type": "EXPENSE",
      "description": "Mua sách",
      "date": "2026-03-29"
    }
  ]
}
```


**Responses:**

| Code | Mo ta |
| --- | --- |
| `200` | Nhập dữ liệu thành công |
| `400` | Body request rỗng hoặc bạn chưa có ví hợp lệ |

**Response 200 - Vi du:**

```json
{
  "status": "success",
  "message": "Nhập 2 giao dịch thành công"
}
```

---

### GET `/api/transactions/export`

**Xuất danh sách giao dịch ra file (CSV/PDF)**

Tải xuống file chứa danh sách giao dịch theo bộ lọc hiện tại.
Hỗ trợ 2 định dạng:
- **CSV**: Phù hợp để mở bằng Excel, Google Sheets
- **PDF**: Phù hợp để in hoặc chia sẻ báo cáo

Các tham số lọc giống với API `GET /api/transactions` (context, type, date range...).
Response trả về file binary, trình duyệt sẽ tự tải về.

> Yeu cau xac thuc: `Bearer Token`

**Parameters:**

| Tham so | Vi tri | Mo ta | Bat buoc | Kieu du lieu |
| --- | --- | --- | --- | --- |
| `format` | query | Định dạng file xuất (csv hoặc pdf) | Khong | string (csv, pdf) [mac dinh: csv] |
| `context` | query | Ngữ cảnh dữ liệu | Khong | string (personal, family) |
| `family_id` | query | ID gia đình (khi context = family) | Khong | string (uuid) |
| `startDate` | query | Ngày bắt đầu (YYYY-MM-DD) | Khong | string (date) |
| `endDate` | query | Ngày kết thúc (YYYY-MM-DD) | Khong | string (date) |
| `type` | query | Lọc theo loại giao dịch | Khong | string (INCOME, EXPENSE, TRANSFER_IN, TRANSFER_OUT) |
| `wallet_id` | query | Lọc theo ví | Khong | string (uuid) |
| `category_id` | query | Lọc theo danh mục | Khong | string (uuid) |
| `search` | query | Tìm kiếm theo mô tả | Khong | string |


**Responses:**

| Code | Mo ta |
| --- | --- |
| `200` | File export được tạo thành công (tự động tải về) |

---

### GET `/api/transactions/{id}`

**Lấy chi tiết một giao dịch**

Trả về thông tin đầy đủ của một giao dịch cụ thể.
User chỉ có thể xem giao dịch thuộc ví mà mình sở hữu hoặc có quyền truy cập.

Thông tin bao gồm: số tiền, loại, mô tả, ngày, ví liên quan, danh mục.

> Yeu cau xac thuc: `Bearer Token`

**Parameters:**

| Tham so | Vi tri | Mo ta | Bat buoc | Kieu du lieu |
| --- | --- | --- | --- | --- |
| `id` | path | UUID của giao dịch cần xem | Co | string (uuid) |


**Responses:**

| Code | Mo ta |
| --- | --- |
| `200` | Chi tiết giao dịch thành công |
| `404` | Không tìm thấy giao dịch hoặc không có quyền (TRANSACTION_NOT_FOUND) |

**Response 200 - Vi du:**

```json
{
  "status": "success",
  "message": "Lấy chi tiết giao dịch thành công",
  "data": {
    "id": "t1a2b3c4-...",
    "amount": 150000,
    "type": "EXPENSE",
    "description": "Cà phê buổi sáng",
    "date": "2026-03-30",
    "wallet": {
      "id": "w1a2b3c4-...",
      "name": "Ví MB Bank"
    },
    "category": {
      "id": "c1a2b3c4-...",
      "name": "Ăn uống"
    }
  }
}
```

---

### DELETE `/api/transactions/{id}`

**Xóa giao dịch (tự động hoàn tác số dư ví)**

Xóa một giao dịch và **tự động hoàn tác** số dư ví tương ứng:
- Xóa giao dịch **EXPENSE**: Cộng lại tiền vào ví
- Xóa giao dịch **INCOME**: Trừ tiền khỏi ví

Hành động này không thể hoàn tác. Nếu cần, hãy tạo giao dịch mới để bù lại.

> Yeu cau xac thuc: `Bearer Token`

**Parameters:**

| Tham so | Vi tri | Mo ta | Bat buoc | Kieu du lieu |
| --- | --- | --- | --- | --- |
| `id` | path | UUID của giao dịch cần xóa | Co | string (uuid) |


**Responses:**

| Code | Mo ta |
| --- | --- |
| `200` | Xóa giao dịch thành công |
| `404` | Không tìm thấy giao dịch hoặc không có quyền (TRANSACTION_NOT_FOUND) |

**Response 200 - Vi du:**

```json
{
  "status": "success",
  "message": "Xóa giao dịch thành công",
  "data": null
}
```

---

## Users

Quản lý hồ sơ cá nhân của người dùng đang đăng nhập.
Tất cả endpoint trong nhóm này yêu cầu Bearer Token.
Đây là nhóm endpoint chính (canonical) cho profile, avatar, đổi mật khẩu.

### GET `/api/users/me`

**Lấy thông tin hồ sơ cá nhân**

Trả về đầy đủ thông tin profile của người dùng đang đăng nhập,
bao gồm tên, email, role, và đường dẫn avatar.

Đây là **canonical endpoint** (endpoint chính).

> Yeu cau xac thuc: `Bearer Token`


**Responses:**

| Code | Mo ta |
| --- | --- |
| `200` | Lấy hồ sơ thành công |
| `401` | Chưa đăng nhập hoặc token hết hạn |
| `404` | Không tìm thấy user (USER_NOT_FOUND) |

**Response 200 - Vi du:**

```json
{
  "status": "success",
  "message": "Lấy profile thành công",
  "data": {
    "id": "b2df0d5d-1234-4abc-9def-bbbd02910001",
    "name": "Nguyễn Văn A",
    "email": "nguyenvana@junkio.com",
    "avatar": "/uploads/avatars/b2df0d5d-avatar.jpg",
    "role": "member"
  }
}
```

---

### PUT `/api/users/me`

**Cập nhật hồ sơ cá nhân**

Cho phép người dùng thay đổi tên hiển thị và các thông tin cá nhân khác.
Chỉ cần gửi các field muốn thay đổi, không bắt buộc gửi tất cả.

**Lưu ý:** Không thể thay đổi email hoặc role qua API này.

> Yeu cau xac thuc: `Bearer Token`


**Request Body:**

*Content-Type:* `application/json`

| Truong | Kieu | Bat buoc | Mo ta |
| --- | --- | --- | --- |
| `name` | string | Khong | Tên hiển thị mới |

**Vi du:**

```json
{
  "name": "Nguyễn Văn B"
}
```


**Responses:**

| Code | Mo ta |
| --- | --- |
| `200` | Cập nhật hồ sơ thành công |
| `401` | Chưa đăng nhập |

**Response 200 - Vi du:**

```json
{
  "status": "success",
  "message": "Cập nhật profile thành công",
  "data": {
    "id": "b2df0d5d-1234-4abc-9def-bbbd02910001",
    "name": "Nguyễn Văn B",
    "email": "nguyenvana@junkio.com"
  }
}
```

---

### DELETE `/api/users/me`

**Xóa tài khoản vĩnh viễn**

Xóa hoàn toàn tài khoản và tất cả dữ liệu liên quan (ví, giao dịch, mục tiêu...).
Hành động này **không thể hoàn tác**.

**Bảo mật:** Yêu cầu nhập đúng mật khẩu hiện tại để xác nhận.
Đây là biện pháp chống xóa nhầm khi token bị đánh cắp.

> Yeu cau xac thuc: `Bearer Token`


**Request Body:**

*Content-Type:* `application/json`

| Truong | Kieu | Bat buoc | Mo ta |
| --- | --- | --- | --- |
| `password` | string | Co | Mật khẩu hiện tại (để xác nhận xóa) |

**Vi du:**

```json
{
  "password": "myCurrentPassword123"
}
```


**Responses:**

| Code | Mo ta |
| --- | --- |
| `200` | Xóa tài khoản thành công |
| `400` | Mật khẩu không đúng (WRONG_PASSWORD) |

**Response 200 - Vi du:**

```json
{
  "status": "success",
  "message": "Tài khoản đã được xóa vĩnh viễn"
}
```

---

### POST `/api/users/me/avatar`

**Cập nhật ảnh đại diện (avatar)**

Upload hoặc thay thế ảnh đại diện của người dùng hiện tại.
Đây là **canonical endpoint** (endpoint chính).

**Yêu cầu file:**
- Định dạng hỗ trợ: JPEG, JPG, PNG, GIF
- Dung lượng tối đa: **5MB**
- Tên field trong form-data: `avatar`

Ảnh cũ sẽ tự động bị xóa khi upload ảnh mới.

> Yeu cau xac thuc: `Bearer Token`


**Request Body:**

*Content-Type:* `multipart/form-data`

| Truong | Kieu | Bat buoc | Mo ta |
| --- | --- | --- | --- |
| `avatar` | string | Co | File ảnh (JPEG/PNG/GIF, tối đa 5MB) |


**Responses:**

| Code | Mo ta |
| --- | --- |
| `200` | Cập nhật avatar thành công |
| `400` | File không hợp lệ (sai định dạng hoặc vượt quá 5MB) |

**Response 200 - Vi du:**

```json
{
  "status": "success",
  "message": "Cập nhật avatar thành công",
  "data": {
    "avatar_url": "/uploads/avatars/b2df0d5d-avatar-1711792000.jpg"
  }
}
```

---

### PUT `/api/users/me/password`

**Đổi mật khẩu tài khoản**

Cho phép người dùng thay đổi mật khẩu hiện tại.
Yêu cầu nhập đúng mật khẩu hiện tại (`currentPassword`) để xác minh danh tính.

**Yêu cầu mật khẩu mới:**
- Tối thiểu 6 ký tự
- Phải khác mật khẩu hiện tại

Sau khi đổi thành công, token hiện tại vẫn hoạt động bình thường.

> Yeu cau xac thuc: `Bearer Token`


**Request Body:**

*Content-Type:* `application/json`

| Truong | Kieu | Bat buoc | Mo ta |
| --- | --- | --- | --- |
| `currentPassword` | string | Co | Mật khẩu hiện tại (để xác minh) |
| `newPassword` | string | Co | Mật khẩu mới (tối thiểu 6 ký tự) |

**Vi du:**

```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword456"
}
```


**Responses:**

| Code | Mo ta |
| --- | --- |
| `200` | Đổi mật khẩu thành công |
| `400` | Mật khẩu hiện tại sai hoặc mật khẩu mới quá ngắn (WRONG_PASSWORD) |

**Response 200 - Vi du:**

```json
{
  "status": "success",
  "message": "Đổi mật khẩu thành công"
}
```

---

## Wallets

Quản lý ví cá nhân và ví gia đình

### GET `/api/wallets`

**Lấy danh sách ví mà người dùng có quyền truy cập**

> Yeu cau xac thuc: `Bearer Token`


**Responses:**

| Code | Mo ta |
| --- | --- |
| `200` | Trả về danh sách ví thành công |

---

### POST `/api/wallets`

**Tạo ví mới**

Bỏ qua \`family_id\` để tạo ví cá nhân. Gửi \`family_id\` để tạo ví gia đình trong gia đình mà bạn được phép quản lý.

> Yeu cau xac thuc: `Bearer Token`


**Request Body:**

*Content-Type:* `application/json`

| Truong | Kieu | Bat buoc | Mo ta |
| --- | --- | --- | --- |
| `name` | string | Co | Ví MB Bank |
| `balance` | number | Khong | 10000000 |
| `currency` | string | Khong | VND |
| `family_id` | string | Khong |  |

**Vi du - Tạo ví cá nhân (Personal Wallet):**

```json
{
  "name": "Ví Cá Nhân ACB",
  "balance": 15000000,
  "currency": "VND"
}
```

**Vi du - Tạo ví gia đình (Family Wallet):**

```json
{
  "name": "Quỹ Sinh Hoạt Chung",
  "balance": 5000000,
  "currency": "VND",
  "family_id": "11111111-1111-1111-1111-111111111111"
}
```


**Responses:**

| Code | Mo ta |
| --- | --- |
| `201` | Tạo ví mới thành công |
| `409` | Tên ví đã tồn tại trong cùng danh mục |
| `422` | Dữ liệu gửi lên không đúng định dạng |

---

### PUT `/api/wallets/{id}`

**Cập nhật thông tin ví**

> Yeu cau xac thuc: `Bearer Token`

**Parameters:**

| Tham so | Vi tri | Mo ta | Bat buoc | Kieu du lieu |
| --- | --- | --- | --- | --- |
| `id` | path |  | Co | string (uuid) |


**Request Body:**

*Content-Type:* `application/json`

| Truong | Kieu | Bat buoc | Mo ta |
| --- | --- | --- | --- |
| `name` | string | Khong | Ví Lương Tháng |
| `balance` | number | Khong | 25000000 |
| `currency` | string | Khong |  |


**Responses:**

| Code | Mo ta |
| --- | --- |
| `200` | Cập nhật ví thành công |
| `404` | Không tìm thấy ví tương ứng (WALLET_NOT_FOUND) |

---

### DELETE `/api/wallets/{id}`

**Xóa ví vĩnh viễn**

> Yeu cau xac thuc: `Bearer Token`

**Parameters:**

| Tham so | Vi tri | Mo ta | Bat buoc | Kieu du lieu |
| --- | --- | --- | --- | --- |
| `id` | path |  | Co | string (uuid) |


**Responses:**

| Code | Mo ta |
| --- | --- |
| `200` | Xóa ví thành công |
| `404` | Không tìm thấy ví |

---

