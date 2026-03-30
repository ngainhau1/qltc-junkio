const express = require('express');
const router = express.Router();
const recurringController = require('../controllers/recurringController');
const authMiddleware = require('../middleware/authMiddleware');
const { validateCreateRecurring, validateUpdateRecurring, validateDeleteRecurring } = require('../validators/recurringValidator');

router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Recurring
 *   description: |
 *     Quản lý giao dịch định kỳ (tự động lặp lại).
 *     Cho phép người dùng thiết lập mẫu giao dịch tự động tạo theo chu kỳ:
 *     hàng ngày, hàng tuần, hàng tháng hoặc hàng năm.
 *     VD: Tiền điện hàng tháng, lương hàng tháng, tiền thuê nhà...
 */

/**
 * @swagger
 * /api/recurring:
 *   get:
 *     summary: Lấy danh sách mẫu giao dịch định kỳ
 *     description: |
 *       Trả về tất cả mẫu giao dịch định kỳ của người dùng hiện tại.
 *       Mỗi mẫu hiển thị: số tiền, tần suất, ngày chạy tiếp theo, trạng thái hoạt động.
 *     tags: [Recurring]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách giao dịch định kỳ thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   amount:
 *                     type: number
 *                   frequency:
 *                     type: string
 *                     enum: [DAILY, WEEKLY, MONTHLY, YEARLY]
 *                   next_run_date:
 *                     type: string
 *                     format: date
 *                   is_active:
 *                     type: boolean
 *             example:
 *               - id: "r1a2b3c4-..."
 *                 amount: 300000
 *                 type: EXPENSE
 *                 description: "Tiền điện hàng tháng"
 *                 frequency: MONTHLY
 *                 next_run_date: "2026-04-01"
 *                 is_active: true
 *               - id: "r2b3c4d5-..."
 *                 amount: 25000000
 *                 type: INCOME
 *                 description: "Lương tháng"
 *                 frequency: MONTHLY
 *                 next_run_date: "2026-04-28"
 *                 is_active: true
 */
router.get('/', recurringController.getPatterns);

/**
 * @swagger
 * /api/recurring:
 *   post:
 *     summary: Tạo mẫu giao dịch định kỳ mới
 *     description: |
 *       Thiết lập một giao dịch tự động lặp lại theo chu kỳ.
 *
 *       **Tần suất hỗ trợ:**
 *       - `DAILY`: Hàng ngày
 *       - `WEEKLY`: Hàng tuần
 *       - `MONTHLY`: Hàng tháng (phổ biến nhất)
 *       - `YEARLY`: Hàng năm
 *
 *       Hệ thống sẽ tự động tạo giao dịch vào `next_run_date` và cập nhật ngày chạy tiếp theo.
 *     tags: [Recurring]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [wallet_id, amount, frequency, next_run_date]
 *             properties:
 *               wallet_id:
 *                 type: string
 *                 format: uuid
 *                 description: UUID ví thực hiện giao dịch
 *               category_id:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *                 description: UUID danh mục (tùy chọn)
 *               amount:
 *                 type: number
 *                 example: 300000
 *                 description: Số tiền mỗi lần (VND)
 *               type:
 *                 type: string
 *                 enum: [INCOME, EXPENSE]
 *                 default: EXPENSE
 *                 description: Loại giao dịch
 *               description:
 *                 type: string
 *                 example: Tiền điện hàng tháng
 *                 description: Mô tả giao dịch
 *               frequency:
 *                 type: string
 *                 enum: [DAILY, WEEKLY, MONTHLY, YEARLY]
 *                 example: MONTHLY
 *                 description: Tần suất lặp lại
 *               next_run_date:
 *                 type: string
 *                 format: date
 *                 example: "2026-04-01"
 *                 description: Ngày chạy tiếp theo (YYYY-MM-DD)
 *           example:
 *             wallet_id: "w1a2b3c4-..."
 *             amount: 300000
 *             type: EXPENSE
 *             description: "Tiền điện hàng tháng"
 *             frequency: MONTHLY
 *             next_run_date: "2026-04-01"
 *     responses:
 *       201:
 *         description: Tạo mẫu định kỳ thành công
 *         content:
 *           application/json:
 *             example:
 *               status: success
 *               message: Tạo giao dịch định kỳ thành công
 *       400:
 *         description: Thiếu trường bắt buộc hoặc dữ liệu không hợp lệ
 */
router.post('/', validateCreateRecurring, recurringController.createPattern);

/**
 * @swagger
 * /api/recurring/trigger-cron:
 *   post:
 *     summary: Kích hoạt xử lý giao dịch định kỳ ngay lập tức
 *     description: |
 *       Chạy ngay lập tức job cron xử lý các giao dịch định kỳ đến hạn.
 *       API này thường được gọi tự động bởi hệ thống cron,
 *       nhưng cũng có thể kích hoạt thủ công để debug hoặc test.
 *
 *       Job sẽ quét tất cả mẫu có `is_active = true` và `next_run_date <= today`,
 *       tạo giao dịch tương ứng và cập nhật `next_run_date` cho chu kỳ tiếp theo.
 *     tags: [Recurring]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Kết quả chạy cron
 *         content:
 *           application/json:
 *             example:
 *               message: "Đã chạy thành công 3 giao dịch định kỳ."
 */
router.post('/trigger-cron', recurringController.triggerCron);

/**
 * @swagger
 * /api/recurring/{id}:
 *   put:
 *     summary: Cập nhật mẫu giao dịch định kỳ
 *     description: |
 *       Thay đổi số tiền, tần suất, trạng thái hoặc ngày chạy của một mẫu định kỳ.
 *       Chỉ gửi các field muốn cập nhật.
 *
 *       **Tạm dừng:** Gửi `is_active: false` để tạm ngừng (không xóa).
 *     tags: [Recurring]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID của mẫu định kỳ
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *               frequency:
 *                 type: string
 *                 enum: [DAILY, WEEKLY, MONTHLY, YEARLY]
 *               is_active:
 *                 type: boolean
 *               next_run_date:
 *                 type: string
 *                 format: date
 *               description:
 *                 type: string
 *           example:
 *             amount: 350000
 *             description: "Tiền điện (đã tăng)"
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *         content:
 *           application/json:
 *             example:
 *               status: success
 *               message: Cập nhật giao dịch định kỳ thành công
 *       404:
 *         description: Không tìm thấy mẫu định kỳ (RECURRING_NOT_FOUND)
 */
router.put('/:id', validateUpdateRecurring, recurringController.updatePattern);

/**
 * @swagger
 * /api/recurring/{id}:
 *   delete:
 *     summary: Xóa mẫu giao dịch định kỳ
 *     description: |
 *       Xóa vĩnh viễn một mẫu giao dịch định kỳ.
 *       Các giao dịch đã tạo trước đó **không bị ảnh hưởng** (vẫn được lưu).
 *       Chỉ ngừng tạo giao dịch mới trong tương lai.
 *     tags: [Recurring]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID của mẫu định kỳ cần xóa
 *     responses:
 *       200:
 *         description: Xóa thành công
 *         content:
 *           application/json:
 *             example:
 *               status: success
 *               message: Xóa giao dịch định kỳ thành công
 *       404:
 *         description: Không tìm thấy mẫu định kỳ (RECURRING_NOT_FOUND)
 */
router.delete('/:id', validateDeleteRecurring, recurringController.deletePattern);

module.exports = router;
