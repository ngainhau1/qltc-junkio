const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const ctrl = require('../controllers/adminController');
const { validateUserParam, validateChangeRole } = require('../validators/adminValidator');
const audit = require('../middleware/auditMiddleware');

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: |
 *     Quản trị hệ thống, chỉ dành cho tài khoản có role **admin**.
 *     Tất cả các endpoint trong nhóm này yêu cầu Bearer Token của admin.
 *     Nếu bạn chưa có quyền admin, hãy liên hệ quản trị viên hệ thống.
 */

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Lấy tổng quan hệ thống (Platform Dashboard)
 *     description: |
 *       Trả về các chỉ số tổng quan nhanh của toàn hệ thống bao gồm:
 *       - Tổng số người dùng đăng ký
 *       - Tổng số giao dịch đã ghi nhận
 *       - Tổng số nhóm gia đình đang hoạt động
 *       - Danh sách 5 người dùng đăng ký gần nhất
 *
 *       API này được gọi khi Admin mở trang Dashboard.
 *     tags: [Admin]
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       200:
 *         description: Dữ liệu dashboard admin thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalUsers:
 *                       type: integer
 *                     totalTransactions:
 *                       type: integer
 *                     totalFamilies:
 *                       type: integer
 *                     recentUsers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *                           role:
 *                             type: string
 *                             enum: [member, staff, admin]
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *             example:
 *               status: success
 *               message: Lấy dữ liệu Dashboard thành công
 *               data:
 *                 totalUsers: 1450
 *                 totalTransactions: 250000
 *                 totalFamilies: 35
 *                 recentUsers:
 *                   - id: "b2df0d5d-1234-4abc-9def-bbbd02910001"
 *                     name: "Nguyễn Văn A"
 *                     email: "nguyenvana@junkio.com"
 *                     role: member
 *                     createdAt: "2026-03-30T10:00:00.000Z"
 *                   - id: "c3ef1e6e-5678-4bcd-aef0-ccce13a20002"
 *                     name: "Trần Thị B"
 *                     email: "tranthib@junkio.com"
 *                     role: member
 *                     createdAt: "2026-03-29T08:30:00.000Z"
 *       401:
 *         description: Chưa đăng nhập hoặc token hết hạn
 *       403:
 *         description: Không có quyền admin
 */
router.get('/dashboard', auth, role('admin'), ctrl.getDashboard);

/**
 * @swagger
 * /api/admin/analytics:
 *   get:
 *     summary: Lấy phân tích dữ liệu toàn hệ thống (System Analytics)
 *     description: |
 *       Trả về dữ liệu phân tích chuyên sâu bao gồm:
 *       - **Thống kê tổng hợp**: Tổng số ví, mục tiêu, ngân sách trên toàn hệ thống
 *       - **Biểu đồ tăng trưởng người dùng** theo từng tháng
 *       - **Top danh mục chi tiêu** phổ biến nhất
 *       - **Hoạt động hàng tuần** (số giao dịch mỗi ngày trong tuần gần nhất)
 *
 *       Dùng để hiển thị biểu đồ trên trang Analytics của Admin Panel.
 *     tags: [Admin]
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       200:
 *         description: Dữ liệu analytics thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     stats:
 *                       type: object
 *                       properties:
 *                         totalWallets:
 *                           type: integer
 *                         totalGoals:
 *                           type: integer
 *                         totalBudgets:
 *                           type: integer
 *                     userGrowth:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           month:
 *                             type: string
 *                           count:
 *                             type: integer
 *                     topCategories:
 *                       type: array
 *                       items:
 *                         type: object
 *                     weeklyActivity:
 *                       type: array
 *                       items:
 *                         type: object
 *             example:
 *               status: success
 *               message: Lấy analytics thành công
 *               data:
 *                 stats:
 *                   totalWallets: 3200
 *                   totalGoals: 580
 *                   totalBudgets: 420
 *                 userGrowth:
 *                   - month: "2026-01"
 *                     count: 120
 *                   - month: "2026-02"
 *                     count: 185
 *                   - month: "2026-03"
 *                     count: 210
 *                 topCategories:
 *                   - name: "Ăn uống"
 *                     count: 45000
 *                   - name: "Di chuyển"
 *                     count: 28000
 *                 weeklyActivity:
 *                   - day: "Mon"
 *                     transactions: 1200
 *                   - day: "Tue"
 *                     transactions: 1350
 *       401:
 *         description: Chưa đăng nhập hoặc token hết hạn
 *       403:
 *         description: Không có quyền admin
 */
router.get('/analytics', auth, role('admin'), ctrl.getAnalytics);

/**
 * @swagger
 * /api/admin/financial-overview:
 *   get:
 *     summary: Lấy tổng quan tài chính toàn hệ thống (Financial Overview)
 *     description: |
 *       Cung cấp cái nhìn toàn cảnh về tình hình tài chính trên nền tảng:
 *       - **Tổng số dư hệ thống** (tổng balance của tất cả ví)
 *       - **Xu hướng thu/chi** theo từng tháng (dùng để vẽ biểu đồ line chart)
 *       - **Top người chi tiêu nhiều nhất**
 *       - **Tỷ lệ tuân thủ ngân sách** (% user giữ chi tiêu trong giới hạn budget)
 *
 *       Endpoint này hữu ích để Admin đánh giá sức khỏe tài chính tổng thể.
 *     tags: [Admin]
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       200:
 *         description: Tổng quan tài chính thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     systemBalance:
 *                       type: number
 *                     revenueTrends:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           month:
 *                             type: string
 *                           income:
 *                             type: number
 *                           expense:
 *                             type: number
 *                     topSpenders:
 *                       type: array
 *                       items:
 *                         type: object
 *                     budgetCompliance:
 *                       type: number
 *             example:
 *               status: success
 *               message: Lấy tổng quan tài chính thành công
 *               data:
 *                 systemBalance: 15750000000
 *                 revenueTrends:
 *                   - month: "2026-01"
 *                     income: 850000000
 *                     expense: 620000000
 *                   - month: "2026-02"
 *                     income: 920000000
 *                     expense: 710000000
 *                 topSpenders:
 *                   - name: "Nguyễn Văn C"
 *                     totalExpense: 25000000
 *                   - name: "Lê Thị D"
 *                     totalExpense: 18500000
 *                 budgetCompliance: 72.5
 *       401:
 *         description: Chưa đăng nhập hoặc token hết hạn
 *       403:
 *         description: Không có quyền admin
 */
router.get('/financial-overview', auth, role('admin'), ctrl.getFinancialOverview);

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Lấy danh sách người dùng toàn hệ thống
 *     description: |
 *       Trả về danh sách tất cả người dùng có phân trang và bộ lọc.
 *       - Hỗ trợ tìm kiếm theo tên hoặc email (`search`)
 *       - Lọc theo role: member, staff, admin hoặc tất cả
 *       - Lọc theo trạng thái: active (đang hoạt động), locked (bị khóa), hoặc tất cả
 *
 *       Kết quả trả về bao gồm thông tin phân trang (tổng số user, số trang).
 *     tags: [Admin]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang hiện tại (bắt đầu từ 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Số lượng user mỗi trang (mặc định 20)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Từ khóa tìm kiếm theo tên hoặc email
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [all, member, staff, admin]
 *           default: all
 *         description: Lọc theo vai trò người dùng
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, active, locked]
 *           default: all
 *         description: Lọc theo trạng thái tài khoản
 *     responses:
 *       200:
 *         description: Danh sách người dùng thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: array
 *                       items:
 *                         type: object
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *             example:
 *               status: success
 *               message: Lấy danh sách user thành công
 *               data:
 *                 users:
 *                   - id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                     name: "Admin Junkio"
 *                     email: "admin@junkio.com"
 *                     role: admin
 *                     is_locked: false
 *                     createdAt: "2026-01-01T00:00:00.000Z"
 *                   - id: "b2c3d4e5-f6a7-8901-bcde-f12345678901"
 *                     name: "Nguyễn Văn Member"
 *                     email: "member@junkio.com"
 *                     role: member
 *                     is_locked: false
 *                     createdAt: "2026-02-15T08:30:00.000Z"
 *                 total: 1450
 *                 page: 1
 *                 totalPages: 73
 *       401:
 *         description: Chưa đăng nhập hoặc token hết hạn
 *       403:
 *         description: Không có quyền admin
 */
router.get('/users', auth, role('admin'), ctrl.listUsers);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   get:
 *     summary: Lấy chi tiết một người dùng
 *     description: |
 *       Trả về thông tin chi tiết của một user cụ thể, bao gồm:
 *       - Thông tin cá nhân (tên, email, role, trạng thái khóa)
 *       - Danh sách ví (wallets) mà user sở hữu
 *       - Danh sách gia đình (families) mà user tham gia
 *       - Tổng số giao dịch đã thực hiện
 *
 *       Admin dùng API này để xem xét hoạt động của một user trước khi quyết định khóa/xóa.
 *     tags: [Admin]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID của user cần xem
 *     responses:
 *       200:
 *         description: Chi tiết user thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                     is_locked:
 *                       type: boolean
 *                     wallets:
 *                       type: array
 *                       items:
 *                         type: object
 *                     Families:
 *                       type: array
 *                       items:
 *                         type: object
 *                     transactionCount:
 *                       type: integer
 *             example:
 *               status: success
 *               message: Lấy chi tiết user thành công
 *               data:
 *                 id: "b2c3d4e5-f6a7-8901-bcde-f12345678901"
 *                 name: "Nguyễn Văn Member"
 *                 email: "member@junkio.com"
 *                 role: member
 *                 is_locked: false
 *                 wallets:
 *                   - id: "w1a2b3c4-..."
 *                     name: "Ví MB Bank"
 *                     balance: 15000000
 *                 Families:
 *                   - id: "f1a2b3c4-..."
 *                     name: "Gia đình Nguyễn"
 *                 transactionCount: 342
 *       404:
 *         description: Không tìm thấy user (USER_NOT_FOUND)
 */
router.get('/users/:id', auth, role('admin'), ctrl.getUserDetail);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Xóa vĩnh viễn một tài khoản người dùng
 *     description: |
 *       Xóa hoàn toàn user khỏi hệ thống. Hành động này **không thể hoàn tác**.
 *       Dữ liệu liên quan (ví, giao dịch, mục tiêu...) sẽ bị xóa theo.
 *
 *       **Lưu ý quan trọng:** Admin không thể tự xóa chính mình.
 *     tags: [Admin]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID của user cần xóa
 *     responses:
 *       200:
 *         description: Xóa user thành công
 *         content:
 *           application/json:
 *             example:
 *               status: success
 *               message: Xóa user thành công
 *       400:
 *         description: Không được xóa chính mình (CANNOT_DELETE_SELF)
 *       404:
 *         description: Không tìm thấy user (USER_NOT_FOUND)
 */
router.delete('/users/:id', auth, role('admin'), validateUserParam, audit('USER_DELETED', 'USER'), ctrl.deleteUser);

/**
 * @swagger
 * /api/admin/users/{id}/toggle-lock:
 *   put:
 *     summary: Khóa hoặc mở khóa tài khoản người dùng
 *     description: |
 *       Chuyển đổi trạng thái khóa của một tài khoản:
 *       - Nếu user đang **active** -> chuyển sang **locked** (không thể đăng nhập)
 *       - Nếu user đang **locked** -> chuyển sang **active** (cho phép đăng nhập lại)
 *
 *       **Lưu ý:** Admin không thể khóa chính mình.
 *       Khi user bị khóa, token hiện tại vẫn hoạt động cho đến khi hết hạn.
 *     tags: [Admin]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID của user cần khóa/mở khóa
 *     responses:
 *       200:
 *         description: Thay đổi trạng thái khóa thành công
 *         content:
 *           application/json:
 *             example:
 *               status: success
 *               message: Đã khóa tài khoản user
 *               data:
 *                 id: "b2c3d4e5-f6a7-8901-bcde-f12345678901"
 *                 is_locked: true
 *       400:
 *         description: Không được khóa chính mình (CANNOT_LOCK_SELF)
 */
router.put('/users/:id/toggle-lock', auth, role('admin'), validateUserParam, audit('USER_LOCKED_UNLOCKED', 'USER'), ctrl.toggleLock);

/**
 * @swagger
 * /api/admin/users/{id}/role:
 *   put:
 *     summary: Thay đổi vai trò (role) của người dùng
 *     description: |
 *       Nâng cấp hoặc hạ cấp quyền hạn của một user trong hệ thống.
 *       Các vai trò hợp lệ:
 *       - `member`: Người dùng thường (mặc định khi đăng ký)
 *       - `staff`: Nhân viên hỗ trợ (có quyền xem báo cáo)
 *       - `admin`: Quản trị viên toàn quyền
 *
 *       **Lưu ý:** Admin không thể thay đổi role của chính mình.
 *     tags: [Admin]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID của user cần đổi role
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [member, staff, admin]
 *                 example: staff
 *           example:
 *             role: staff
 *     responses:
 *       200:
 *         description: Đổi role thành công
 *         content:
 *           application/json:
 *             example:
 *               status: success
 *               message: Đổi role thành công
 *               data:
 *                 id: "b2c3d4e5-f6a7-8901-bcde-f12345678901"
 *                 role: staff
 *       400:
 *         description: Role không hợp lệ hoặc đang tự đổi role (INVALID_ROLE / CANNOT_CHANGE_OWN_ROLE)
 */
router.put('/users/:id/role', auth, role('admin'), validateChangeRole, audit('ROLE_CHANGED', 'USER'), ctrl.changeRole);

/**
 * @swagger
 * /api/admin/logs:
 *   get:
 *     summary: Lấy nhật ký hệ thống (Audit Logs)
 *     description: |
 *       Trả về danh sách các hành động quan trọng đã xảy ra trên hệ thống, bao gồm:
 *       - Đăng nhập / Đăng ký người dùng
 *       - Tạo / Xóa ví, giao dịch
 *       - Thay đổi role, khóa tài khoản
 *       - Các thao tác nhạy cảm khác
 *
 *       Hỗ trợ phân trang và lọc theo loại hành động (`action`).
 *       Đây là công cụ quan trọng để Admin theo dõi hoạt động và phát hiện bất thường.
 *     tags: [Admin]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang hiện tại
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Số bản ghi mỗi trang (mặc định 50)
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           default: ALL
 *         description: Lọc theo loại hành động (VD USER_LOGIN, USER_REGISTER, ROLE_CHANGED). Để ALL để xem tất cả.
 *     responses:
 *       200:
 *         description: Danh sách audit logs thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     logs:
 *                       type: array
 *                       items:
 *                         type: object
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *             example:
 *               status: success
 *               message: Lấy audit logs thành công
 *               data:
 *                 logs:
 *                   - id: "log-001"
 *                     action: USER_LOGIN
 *                     userId: "b2c3d4e5-..."
 *                     details: "User đăng nhập thành công"
 *                     createdAt: "2026-03-30T09:15:00.000Z"
 *                   - id: "log-002"
 *                     action: ROLE_CHANGED
 *                     userId: "a1b2c3d4-..."
 *                     details: "Đổi role từ member sang staff"
 *                     createdAt: "2026-03-30T08:45:00.000Z"
 *                 total: 5280
 *                 page: 1
 *                 totalPages: 106
 *       401:
 *         description: Chưa đăng nhập hoặc token hết hạn
 *       403:
 *         description: Không có quyền admin
 */
router.get('/logs', auth, role('admin'), ctrl.getLogs);

module.exports = router;
