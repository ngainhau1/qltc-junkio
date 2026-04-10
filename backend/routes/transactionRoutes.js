const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const authMiddleware = require('../middleware/authMiddleware');
const {
    validateTransactionCreate,
    validateTransactionTransfer,
    validateTransactionImport,
    validateTransactionParams,
    validateTransactionQuery
} = require('../validators/transactionValidator');

/**
 * @swagger
 * tags:
 *   name: Transactions
 *   description: |
 *     Quản lý giao dịch thu chi, chuyển tiền, nhập và xuất dữ liệu.
 *     Đây là nhóm API trọng tâm của hệ thống, cho phép người dùng:
 *     - Ghi nhận thu nhập / chi tiêu hàng ngày
 *     - Chuyển tiền giữa các ví
 *     - Nhập hàng loạt giao dịch từ file
 *     - Xuất dữ liệu ra CSV/PDF
 */

/**
 * @swagger
 * /api/transactions:
 *   get:
 *     summary: Lấy danh sách giao dịch có phân trang và bộ lọc
 *     description: |
 *       Trả về danh sách giao dịch của người dùng hiện tại, hỗ trợ nhiều bộ lọc:
 *       - **Context**: Xem giao dịch cá nhân (`personal`) hoặc gia đình (`family`)
 *       - **Loại giao dịch**: INCOME, EXPENSE, TRANSFER_IN, TRANSFER_OUT
 *       - **Khoảng thời gian**: Lọc theo ngày bắt đầu / kết thúc
 *       - **Ví cụ thể**: Lọc theo wallet_id
 *       - **Danh mục**: Lọc theo category_id
 *       - **Tìm kiếm**: Tìm theo mô tả giao dịch
 *
 *       Kết quả có phân trang, mặc định 10 bản ghi mỗi trang.
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: context
 *         schema:
 *           type: string
 *           enum: [personal, family]
 *         description: Chọn ngữ cảnh dữ liệu cần xem (cá nhân hoặc gia đình)
 *       - in: query
 *         name: family_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID gia đình (bắt buộc khi context = family)
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
 *           default: 10
 *         description: Số giao dịch mỗi trang
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [INCOME, EXPENSE, TRANSFER_IN, TRANSFER_OUT]
 *         description: Lọc theo loại giao dịch
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày bắt đầu lọc (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày kết thúc lọc (YYYY-MM-DD)
 *       - in: query
 *         name: wallet_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Lọc theo ID ví cụ thể
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Lọc theo danh mục thu/chi
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo từ khóa trong mô tả giao dịch
 *     responses:
 *       200:
 *         description: Danh sách giao dịch thành công
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
 *                     transactions:
 *                       type: array
 *                       items:
 *                         type: object
 *                     totalItems:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     currentPage:
 *                       type: integer
 *             example:
 *               status: success
 *               message: Lấy danh sách giao dịch thành công
 *               data:
 *                 transactions:
 *                   - id: "t1a2b3c4-5678-9abc-def0-123456789001"
 *                     amount: 150000
 *                     type: EXPENSE
 *                     description: "Cà phê buổi sáng"
 *                     date: "2026-03-30"
 *                     wallet_id: "w1a2b3c4-..."
 *                     category_id: "c1a2b3c4-..."
 *                   - id: "t1a2b3c4-5678-9abc-def0-123456789002"
 *                     amount: 25000000
 *                     type: INCOME
 *                     description: "Lương tháng 3"
 *                     date: "2026-03-28"
 *                     wallet_id: "w1a2b3c4-..."
 *                     category_id: null
 *                 totalItems: 342
 *                 totalPages: 35
 *                 currentPage: 1
 */
router.get('/', authMiddleware, validateTransactionQuery, transactionController.getTransactions);

/**
 * @swagger
 * /api/transactions:
 *   post:
 *     summary: Tạo giao dịch mới (thu nhập hoặc chi tiêu)
 *     description: |
 *       Ghi nhận một giao dịch thu nhập hoặc chi tiêu mới vào ví.
 *
 *       **Yêu cầu:**
 *       - Phải có ít nhất một ví hợp lệ trước khi tạo giao dịch
 *       - `wallet_id` phải là ví mà bạn sở hữu hoặc có quyền truy cập (ví gia đình)
 *       - Khi tạo giao dịch EXPENSE, số dư ví phải đủ
 *
 *       **Luồng xử lý:**
 *       - INCOME: Tự động cộng `amount` vào số dư ví
 *       - EXPENSE: Tự động trừ `amount` khỏi số dư ví
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [wallet_id, amount, type, date]
 *             properties:
 *               wallet_id:
 *                 type: string
 *                 format: uuid
 *                 description: ID ví thực hiện giao dịch
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *                 example: 150000
 *                 description: Số tiền giao dịch (phải lớn hơn 0)
 *               type:
 *                 type: string
 *                 enum: [INCOME, EXPENSE]
 *                 example: EXPENSE
 *                 description: Loại giao dịch
 *               description:
 *                 type: string
 *                 example: Cà phê buổi sáng
 *                 description: Mô tả giao dịch (tùy chọn)
 *               category_id:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *                 description: ID danh mục (tùy chọn)
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2026-03-30"
 *                 description: Ngày giao dịch (YYYY-MM-DD)
 *           examples:
 *             chi_tieu:
 *               summary: Ghi nhận chi tiêu
 *               value:
 *                 wallet_id: "w1a2b3c4-5678-9abc-def0-123456789001"
 *                 amount: 150000
 *                 type: EXPENSE
 *                 description: "Cà phê buổi sáng"
 *                 date: "2026-03-30"
 *             thu_nhap:
 *               summary: Ghi nhận thu nhập
 *               value:
 *                 wallet_id: "w1a2b3c4-5678-9abc-def0-123456789001"
 *                 amount: 25000000
 *                 type: INCOME
 *                 description: "Lương tháng 3/2026"
 *                 date: "2026-03-28"
 *     responses:
 *       201:
 *         description: Tạo giao dịch thành công
 *         content:
 *           application/json:
 *             example:
 *               status: success
 *               message: Tạo giao dịch thành công
 *               data:
 *                 id: "t1a2b3c4-new-transaction-id"
 *                 amount: 150000
 *                 type: EXPENSE
 *                 description: "Cà phê buổi sáng"
 *                 wallet_balance: 9850000
 *       400:
 *         description: Chưa có ví hoặc số dư không đủ (INSUFFICIENT_BALANCE)
 *       422:
 *         description: Dữ liệu body không hợp lệ
 */
router.post('/', authMiddleware, validateTransactionCreate, transactionController.createTransaction);

/**
 * @swagger
 * /api/transactions/transfer:
 *   post:
 *     summary: Chuyển tiền giữa hai ví
 *     description: |
 *       Thực hiện chuyển tiền từ ví nguồn sang ví đích.
 *       Hệ thống tự động tạo 2 giao dịch liên kết:
 *       - **TRANSFER_OUT** trên ví nguồn (trừ tiền)
 *       - **TRANSFER_IN** trên ví đích (cộng tiền)
 *
 *       Cả hai ví phải thuộc quyền quản lý của user (ví cá nhân hoặc ví gia đình).
 *       Hai giao dịch được liên kết bằng `transfer_group_id` để dễ truy vết.
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [from_wallet_id, to_wallet_id, amount]
 *             properties:
 *               from_wallet_id:
 *                 type: string
 *                 format: uuid
 *                 description: ID ví nguồn (trừ tiền)
 *               to_wallet_id:
 *                 type: string
 *                 format: uuid
 *                 description: ID ví đích (cộng tiền)
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *                 example: 5000000
 *                 description: Số tiền chuyển (phải nhỏ hơn hoặc bằng số dư ví nguồn)
 *               description:
 *                 type: string
 *                 example: Chuyển tiền tiết kiệm
 *                 description: Ghi chú chuyển khoản
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Ngày chuyển khoản
 *           example:
 *             from_wallet_id: "w-source-1234-..."
 *             to_wallet_id: "w-dest-5678-..."
 *             amount: 5000000
 *             description: "Chuyển sang ví tiết kiệm"
 *     responses:
 *       201:
 *         description: Chuyển tiền thành công
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
 *                     transfer_group_id:
 *                       type: string
 *                       format: uuid
 *                     transfer_out_id:
 *                       type: string
 *                       format: uuid
 *                     transfer_in_id:
 *                       type: string
 *                       format: uuid
 *                     from_wallet_balance:
 *                       type: number
 *                     to_wallet_balance:
 *                       type: number
 *             example:
 *               status: success
 *               message: Chuyển tiền thành công
 *               data:
 *                 transfer_group_id: "tg-a1b2c3d4-..."
 *                 transfer_out_id: "t-out-5678-..."
 *                 transfer_in_id: "t-in-9012-..."
 *                 from_wallet_balance: 5000000
 *                 to_wallet_balance: 15000000
 *       400:
 *         description: Ví không hợp lệ hoặc số dư không đủ (INSUFFICIENT_BALANCE)
 */
router.post('/transfer', authMiddleware, validateTransactionTransfer, transactionController.createTransfer);

/**
 * @swagger
 * /api/transactions/import:
 *   post:
 *     summary: Nhập hàng loạt giao dịch (Bulk Import)
 *     description: |
 *       Cho phép nhập nhiều giao dịch cùng lúc trong một request.
 *       Hữu ích khi:
 *       - Chuyển dữ liệu từ ứng dụng khác sang Junkio
 *       - Nhập dữ liệu từ file Excel/CSV đã parse
 *       - Tự động hóa việc ghi nhận giao dịch
 *
 *       **Lưu ý:** Mỗi giao dịch trong mảng sẽ được xử lý độc lập.
 *       Nếu một giao dịch lỗi, các giao dịch khác vẫn được tạo thành công.
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [transactions]
 *             properties:
 *               transactions:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required: [wallet_id, amount, type, date]
 *                   properties:
 *                     wallet_id:
 *                       type: string
 *                       format: uuid
 *                     amount:
 *                       type: number
 *                     type:
 *                       type: string
 *                       enum: [INCOME, EXPENSE]
 *                     description:
 *                       type: string
 *                     category_id:
 *                       type: string
 *                       format: uuid
 *                       nullable: true
 *                     date:
 *                       type: string
 *                       format: date
 *           example:
 *             transactions:
 *               - wallet_id: "w1a2b3c4-..."
 *                 amount: 50000
 *                 type: EXPENSE
 *                 description: "Grab đi làm"
 *                 date: "2026-03-28"
 *               - wallet_id: "w1a2b3c4-..."
 *                 amount: 200000
 *                 type: EXPENSE
 *                 description: "Mua sách"
 *                 date: "2026-03-29"
 *     responses:
 *       200:
 *         description: Nhập dữ liệu thành công
 *         content:
 *           application/json:
 *             example:
 *               status: success
 *               message: Nhập 2 giao dịch thành công
 *       400:
 *         description: Body request rỗng hoặc bạn chưa có ví hợp lệ
 */
router.post('/import', authMiddleware, validateTransactionImport, transactionController.importTransactions);

/**
 * @swagger
 * /api/transactions/export:
 *   get:
 *     summary: Xuất danh sách giao dịch ra file (CSV/PDF)
 *     description: |
 *       Tải xuống file chứa danh sách giao dịch theo bộ lọc hiện tại.
 *       Hỗ trợ 2 định dạng:
 *       - **CSV**: Phù hợp để mở bằng Excel, Google Sheets
 *       - **PDF**: Phù hợp để in hoặc chia sẻ báo cáo
 *
 *       Các tham số lọc giống với API `GET /api/transactions` (context, type, date range...).
 *       Response trả về file binary, trình duyệt sẽ tự tải về.
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [csv, pdf]
 *           default: csv
 *         description: Định dạng file xuất (csv hoặc pdf)
 *       - in: query
 *         name: context
 *         schema:
 *           type: string
 *           enum: [personal, family]
 *         description: Ngữ cảnh dữ liệu
 *       - in: query
 *         name: family_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID gia đình (khi context = family)
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày bắt đầu (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày kết thúc (YYYY-MM-DD)
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [INCOME, EXPENSE, TRANSFER_IN, TRANSFER_OUT]
 *         description: Lọc theo loại giao dịch
 *       - in: query
 *         name: wallet_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Lọc theo ví
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Lọc theo danh mục
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo mô tả
 *     responses:
 *       200:
 *         description: File export được tạo thành công (tự động tải về)
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/export', authMiddleware, validateTransactionQuery, transactionController.exportTransactions);

/**
 * @swagger
 * /api/transactions/{id}:
 *   get:
 *     summary: Lấy chi tiết một giao dịch
 *     description: |
 *       Trả về thông tin đầy đủ của một giao dịch cụ thể.
 *       User chỉ có thể xem giao dịch thuộc ví mà mình sở hữu hoặc có quyền truy cập.
 *
 *       Thông tin bao gồm: số tiền, loại, mô tả, ngày, ví liên quan, danh mục.
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID của giao dịch cần xem
 *     responses:
 *       200:
 *         description: Chi tiết giao dịch thành công
 *         content:
 *           application/json:
 *             example:
 *               status: success
 *               message: Lấy chi tiết giao dịch thành công
 *               data:
 *                 id: "t1a2b3c4-..."
 *                 amount: 150000
 *                 type: EXPENSE
 *                 description: "Cà phê buổi sáng"
 *                 date: "2026-03-30"
 *                 wallet:
 *                   id: "w1a2b3c4-..."
 *                   name: "Ví MB Bank"
 *                 category:
 *                   id: "c1a2b3c4-..."
 *                   name: "Ăn uống"
 *       404:
 *         description: Không tìm thấy giao dịch hoặc không có quyền (TRANSACTION_NOT_FOUND)
 */
router.get('/:id', authMiddleware, validateTransactionParams, transactionController.getTransactionById);

/**
 * @swagger
 * /api/transactions/{id}:
 *   delete:
 *     summary: Xóa giao dịch (tự động hoàn tác số dư ví)
 *     description: |
 *       Xóa một giao dịch và **tự động hoàn tác** số dư ví tương ứng:
 *       - Xóa giao dịch **EXPENSE**: Cộng lại tiền vào ví
 *       - Xóa giao dịch **INCOME**: Trừ tiền khỏi ví
 *
 *       Hành động này không thể hoàn tác. Nếu cần, hãy tạo giao dịch mới để bù lại.
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID của giao dịch cần xóa
 *     responses:
 *       200:
 *         description: Xóa giao dịch thành công
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
 *                   nullable: true
 *             example:
 *               status: success
 *               message: Xóa giao dịch thành công
 *               data: null
 *       404:
 *         description: Không tìm thấy giao dịch hoặc không có quyền (TRANSACTION_NOT_FOUND)
 */
router.delete('/:id', authMiddleware, validateTransactionParams, transactionController.deleteTransaction);

module.exports = router;
