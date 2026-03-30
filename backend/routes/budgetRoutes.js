const express = require('express');
const router = express.Router();
const budgetController = require('../controllers/budgetController');
const authMiddleware = require('../middleware/authMiddleware');
const {
    validateCreateBudget,
    validateUpdateBudget,
    validateDeleteBudget
} = require('../validators/budgetValidator');

router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Budgets
 *   description: |
 *     Quản lý ngân sách thu/chi theo danh mục và khoảng thời gian.
 *     Budget giúp người dùng đặt giới hạn chi tiêu cho từng danh mục
 *     (VD: Ăn uống tối đa 3 triệu/tháng). Hỗ trợ cả ngân sách cá nhân và gia đình.
 */

/**
 * @swagger
 * /api/budgets:
 *   get:
 *     summary: Lấy danh sách ngân sách mà user có quyền xem
 *     description: |
 *       Trả về toàn bộ ngân sách:
 *       - **Ngân sách cá nhân** của user
 *       - **Ngân sách gia đình** thuộc các family mà user là thành viên
 *
 *       Mỗi budget bao gồm: danh mục, hạn mức, khoảng thời gian, số tiền đã chi.
 *     tags: [Budgets]
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       200:
 *         description: Danh sách ngân sách thành công
 *         content:
 *           application/json:
 *             example:
 *               status: success
 *               message: Lấy danh sách budget thành công
 *               data:
 *                 - id: "b1a2b3c4-..."
 *                   category_id: "c1a2b3c4-..."
 *                   category_name: "Ăn uống"
 *                   amount_limit: 3000000
 *                   spent: 1850000
 *                   start_date: "2026-03-01"
 *                   end_date: "2026-03-31"
 *                   family_id: null
 *                 - id: "b2b3c4d5-..."
 *                   category_id: "c2b3c4d5-..."
 *                   category_name: "Di chuyển"
 *                   amount_limit: 5000000
 *                   spent: 2100000
 *                   start_date: "2026-03-01"
 *                   end_date: "2026-03-31"
 *                   family_id: "f1a2b3c4-..."
 */
router.get('/', budgetController.getBudgets);

/**
 * @swagger
 * /api/budgets:
 *   post:
 *     summary: Tạo ngân sách mới
 *     description: |
 *       Tạo một ngân sách mới để giới hạn chi tiêu theo danh mục và thời gian.
 *
 *       **Hướng dẫn:**
 *       - Bỏ qua `family_id` (hoặc gửi null) -> Tạo **ngân sách cá nhân**
 *       - Gửi `family_id` hợp lệ -> Tạo **ngân sách gia đình** (phải là thành viên family đó)
 *
 *       **Ví dụ:** Đặt ngân sách 3 triệu VND cho danh mục "Ăn uống" trong tháng 3/2026.
 *     tags: [Budgets]
 *     security: [ { bearerAuth: [] } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [category_id, amount_limit, start_date, end_date]
 *             properties:
 *               category_id:
 *                 type: string
 *                 format: uuid
 *                 description: UUID của danh mục chi tiêu
 *               amount_limit:
 *                 type: number
 *                 minimum: 0.01
 *                 example: 3000000
 *                 description: Hạn mức chi tiêu (VND)
 *               start_date:
 *                 type: string
 *                 format: date
 *                 example: "2026-03-01"
 *                 description: Ngày bắt đầu (YYYY-MM-DD)
 *               end_date:
 *                 type: string
 *                 format: date
 *                 example: "2026-03-31"
 *                 description: Ngày kết thúc (YYYY-MM-DD)
 *               family_id:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *                 description: UUID gia đình (để null nếu là ngân sách cá nhân)
 *           examples:
 *             ngan_sach_ca_nhan:
 *               summary: Tạo ngân sách cá nhân
 *               value:
 *                 category_id: "11111111-1111-1111-1111-111111111111"
 *                 amount_limit: 3000000
 *                 start_date: "2026-03-01"
 *                 end_date: "2026-03-31"
 *             ngan_sach_gia_dinh:
 *               summary: Tạo ngân sách gia đình
 *               value:
 *                 category_id: "11111111-1111-1111-1111-111111111111"
 *                 amount_limit: 5000000
 *                 start_date: "2026-03-01"
 *                 end_date: "2026-03-31"
 *                 family_id: "22222222-2222-2222-2222-222222222222"
 *     responses:
 *       201:
 *         description: Tạo ngân sách thành công
 *         content:
 *           application/json:
 *             example:
 *               status: success
 *               message: Tạo budget thành công
 *       403:
 *         description: User không thuộc gia đình được chỉ định (NOT_FAMILY_MEMBER)
 *       422:
 *         description: Dữ liệu không hợp lệ
 */
router.post('/', validateCreateBudget, budgetController.createBudget);

/**
 * @swagger
 * /api/budgets/{id}:
 *   put:
 *     summary: Cập nhật ngân sách
 *     description: |
 *       Cập nhật hạn mức, khoảng thời gian hoặc scope của ngân sách.
 *
 *       **Chuyển đổi scope:**
 *       - Gửi `family_id: null` -> Chuyển budget về **cá nhân**
 *       - Gửi `family_id` hợp lệ -> Chuyển sang **gia đình**
 *
 *       Chỉ gửi các field muốn thay đổi (partial update).
 *     tags: [Budgets]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID của ngân sách cần cập nhật
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               category_id:
 *                 type: string
 *                 format: uuid
 *               amount_limit:
 *                 type: number
 *                 minimum: 0.01
 *               start_date:
 *                 type: string
 *                 format: date
 *               end_date:
 *                 type: string
 *                 format: date
 *               family_id:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *           example:
 *             amount_limit: 4000000
 *     responses:
 *       200:
 *         description: Cập nhật ngân sách thành công
 *         content:
 *           application/json:
 *             example:
 *               status: success
 *               message: Cập nhật budget thành công
 *       404:
 *         description: Không tìm thấy ngân sách (BUDGET_NOT_FOUND)
 */
router.put('/:id', validateUpdateBudget, budgetController.updateBudget);

/**
 * @swagger
 * /api/budgets/{id}:
 *   delete:
 *     summary: Xóa ngân sách
 *     description: |
 *       Xóa vĩnh viễn một ngân sách. Hành động này không ảnh hưởng đến các giao dịch
 *       đã thực hiện trước đó, chỉ xóa bỏ giới hạn theo dõi chi tiêu.
 *     tags: [Budgets]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID của ngân sách cần xóa
 *     responses:
 *       200:
 *         description: Xóa ngân sách thành công
 *         content:
 *           application/json:
 *             example:
 *               status: success
 *               message: Xóa budget thành công
 *       404:
 *         description: Không tìm thấy ngân sách (BUDGET_NOT_FOUND)
 */
router.delete('/:id', validateDeleteBudget, budgetController.deleteBudget);

module.exports = router;
