const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const authMiddleware = require('../middleware/authMiddleware');
const { validateCreateCategory, validateUpdateCategory, validateDeleteCategory } = require('../validators/categoryValidator');

router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: |
 *     Quản lý danh mục thu/chi.
 *     Danh mục dùng để phân loại giao dịch (VD: Ăn uống, Di chuyển, Lương...).
 *     Hỗ trợ danh mục cha-con (parent_id) để tổ chức phân cấp.
 */

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Lấy danh sách tất cả danh mục
 *     description: |
 *       Trả về toàn bộ danh mục thu/chi có sẵn trong hệ thống.
 *       Danh mục được chia thành 2 loại:
 *       - **INCOME**: Danh mục thu nhập (VD: Lương, Thưởng, Đầu tư)
 *       - **EXPENSE**: Danh mục chi tiêu (VD: Ăn uống, Di chuyển, Giải trí)
 *
 *       Mỗi danh mục có thể có `parent_id` trỏ đến danh mục cha (cấu trúc cây).
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách danh mục thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   type:
 *                     type: string
 *                     enum: [INCOME, EXPENSE]
 *                   icon:
 *                     type: string
 *                   parent_id:
 *                     type: string
 *                     nullable: true
 *             example:
 *               - id: "c1a2b3c4-..."
 *                 name: "Ăn uống"
 *                 type: EXPENSE
 *                 icon: "Utensils"
 *                 parent_id: null
 *               - id: "c2b3c4d5-..."
 *                 name: "Cà phê"
 *                 type: EXPENSE
 *                 icon: "Coffee"
 *                 parent_id: "c1a2b3c4-..."
 *               - id: "c3c4d5e6-..."
 *                 name: "Lương"
 *                 type: INCOME
 *                 icon: "Banknote"
 *                 parent_id: null
 */
router.get('/', categoryController.getCategories);

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Tạo danh mục thu/chi mới
 *     description: |
 *       Tạo một danh mục mới để phân loại giao dịch.
 *
 *       **Hướng dẫn:**
 *       - `name`: Tên danh mục (bắt buộc, VD: "Ăn uống", "Lương")
 *       - `type`: INCOME (thu nhập) hoặc EXPENSE (chi tiêu)
 *       - `icon`: Tên icon hiển thị trên giao diện (icon từ thư viện Lucide React)
 *       - `parent_id`: UUID của danh mục cha (để null nếu là danh mục gốc)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, type]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Ăn uống
 *                 description: Tên danh mục
 *               type:
 *                 type: string
 *                 enum: [INCOME, EXPENSE]
 *                 example: EXPENSE
 *                 description: Loại danh mục
 *               parent_id:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *                 description: UUID danh mục cha (để trống nếu là gốc)
 *               icon:
 *                 type: string
 *                 example: Utensils
 *                 description: Tên icon Lucide React
 *           examples:
 *             danh_muc_goc:
 *               summary: Tạo danh mục gốc (chi tiêu)
 *               value:
 *                 name: Giải trí
 *                 type: EXPENSE
 *                 icon: Gamepad2
 *             danh_muc_con:
 *               summary: Tạo danh mục con
 *               value:
 *                 name: Xem phim
 *                 type: EXPENSE
 *                 icon: Film
 *                 parent_id: "c1a2b3c4-uuid-cua-danh-muc-cha"
 *     responses:
 *       201:
 *         description: Tạo danh mục thành công
 *         content:
 *           application/json:
 *             example:
 *               status: success
 *               message: Tạo danh mục thành công
 *               data:
 *                 id: "c-new-category-id"
 *                 name: "Giải trí"
 *                 type: EXPENSE
 *                 icon: "Gamepad2"
 *                 parent_id: null
 *       400:
 *         description: Dữ liệu không hợp lệ (thiếu name hoặc type)
 */
router.post('/', validateCreateCategory, categoryController.createCategory);

/**
 * @swagger
 * /api/categories/{id}:
 *   put:
 *     summary: Cập nhật thông tin danh mục
 *     description: |
 *       Thay đổi tên, loại hoặc icon của một danh mục hiện có.
 *       Chỉ gửi các field muốn cập nhật (partial update).
 *
 *       **Lưu ý:** Thay đổi `type` (INCOME <-> EXPENSE) sẽ ảnh hưởng đến
 *       cách hiển thị các giao dịch đã gắn danh mục này.
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID của danh mục cần cập nhật
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Tên mới của danh mục
 *               type:
 *                 type: string
 *                 enum: [INCOME, EXPENSE]
 *                 description: Loại mới
 *               icon:
 *                 type: string
 *                 description: Icon mới
 *           example:
 *             name: "Ăn vặt"
 *             icon: "Cookie"
 *     responses:
 *       200:
 *         description: Cập nhật danh mục thành công
 *         content:
 *           application/json:
 *             example:
 *               status: success
 *               message: Cập nhật danh mục thành công
 *       404:
 *         description: Không tìm thấy danh mục (CATEGORY_NOT_FOUND)
 */
router.put('/:id', validateUpdateCategory, categoryController.updateCategory);

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: Xóa danh mục
 *     description: |
 *       Xóa vĩnh viễn một danh mục khỏi hệ thống.
 *
 *       **Lưu ý:** Các giao dịch đã gắn danh mục này sẽ bị mất liên kết
 *       (category_id trở thành null). Nên kiểm tra trước khi xóa.
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID của danh mục cần xóa
 *     responses:
 *       200:
 *         description: Xóa danh mục thành công
 *         content:
 *           application/json:
 *             example:
 *               status: success
 *               message: Xóa danh mục thành công
 *       404:
 *         description: Không tìm thấy danh mục (CATEGORY_NOT_FOUND)
 */
router.delete('/:id', validateDeleteCategory, categoryController.deleteCategory);

module.exports = router;
