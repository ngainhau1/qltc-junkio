const express = require('express');
const router = express.Router();
const goalController = require('../controllers/goalController');
const authMiddleware = require('../middleware/authMiddleware');
const {
    validateCreateGoal,
    validateUpdateGoal,
    validateDepositGoal,
    validateDeleteGoal
} = require('../validators/goalValidator');

router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Goals
 *   description: |
 *     Quản lý mục tiêu tài chính (tiết kiệm).
 *     Mục tiêu giúp người dùng theo dõi tiến độ tiết kiệm cho một mục đích cụ thể
 *     (VD: mua laptop, du lịch, quỹ khẩn cấp...).
 *     Người dùng có thể nạp tiền từ ví cá nhân vào mục tiêu.
 */

/**
 * @swagger
 * /api/goals:
 *   get:
 *     summary: Lấy danh sách mục tiêu tài chính
 *     description: |
 *       Trả về tất cả mục tiêu của người dùng hiện tại,
 *       bao gồm cả mục tiêu cá nhân và mục tiêu gia đình (nếu có).
 *       Mỗi mục tiêu hiển thị: tên, số tiền mục tiêu, số tiền đã nạp, trạng thái, deadline.
 *     tags: [Goals]
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       200:
 *         description: Danh sách mục tiêu thành công
 *         content:
 *           application/json:
 *             example:
 *               status: success
 *               message: Lấy danh sách mục tiêu thành công
 *               data:
 *                 - id: "g1a2b3c4-..."
 *                   name: "Mua laptop mới"
 *                   targetAmount: 30000000
 *                   currentAmount: 12000000
 *                   status: IN_PROGRESS
 *                   deadline: "2026-12-31"
 *                   colorCode: "#16a34a"
 *                 - id: "g2b3c4d5-..."
 *                   name: "Du lịch Đà Lạt"
 *                   targetAmount: 10000000
 *                   currentAmount: 10000000
 *                   status: ACHIEVED
 *                   deadline: "2026-06-01"
 *                   colorCode: "#2563eb"
 */
router.get('/', goalController.getGoals);

/**
 * @swagger
 * /api/goals:
 *   post:
 *     summary: Tạo mục tiêu tiết kiệm mới
 *     description: |
 *       Tạo một mục tiêu tài chính mới để theo dõi tiến độ tiết kiệm.
 *
 *       **Các trường:**
 *       - `name`: Tên mục tiêu (bắt buộc)
 *       - `targetAmount`: Số tiền mục tiêu cần đạt (bắt buộc, > 0)
 *       - `deadline`: Hạn chót (tùy chọn, định dạng YYYY-MM-DD)
 *       - `colorCode`: Mã màu hex hiển thị trên giao diện
 *       - `imageUrl`: Tên icon đại diện cho mục tiêu
 *     tags: [Goals]
 *     security: [ { bearerAuth: [] } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, targetAmount]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Mua laptop mới
 *                 description: Tên mục tiêu
 *               targetAmount:
 *                 type: number
 *                 minimum: 0.01
 *                 example: 30000000
 *                 description: Số tiền mục tiêu (VND)
 *               deadline:
 *                 type: string
 *                 format: date
 *                 nullable: true
 *                 example: "2026-12-31"
 *                 description: Hạn chót (tùy chọn)
 *               colorCode:
 *                 type: string
 *                 example: '#16a34a'
 *                 description: Mã màu hex
 *               imageUrl:
 *                 type: string
 *                 example: Laptop
 *                 description: Tên icon
 *           example:
 *             name: Mua laptop mới
 *             targetAmount: 30000000
 *             deadline: "2026-12-31"
 *             colorCode: "#16a34a"
 *             imageUrl: Laptop
 *     responses:
 *       201:
 *         description: Tạo mục tiêu thành công
 *         content:
 *           application/json:
 *             example:
 *               status: success
 *               message: Tạo mục tiêu thành công
 *               data:
 *                 id: "g-new-goal-id"
 *                 name: "Mua laptop mới"
 *                 targetAmount: 30000000
 *                 currentAmount: 0
 *                 status: IN_PROGRESS
 *       422:
 *         description: Dữ liệu không hợp lệ (thiếu name hoặc targetAmount <= 0)
 */
router.post('/', validateCreateGoal, goalController.createGoal);

/**
 * @swagger
 * /api/goals/{id}:
 *   put:
 *     summary: Cập nhật thông tin mục tiêu
 *     description: |
 *       Thay đổi tên, số tiền mục tiêu, deadline hoặc trạng thái của một mục tiêu.
 *       Chỉ gửi các field muốn cập nhật (partial update).
 *
 *       **Trạng thái hợp lệ:**
 *       - `IN_PROGRESS`: Đang thực hiện
 *       - `ACHIEVED`: Đã hoàn thành (người dùng tự đánh dấu hoặc hệ thống tự chuyển khi đạt mục tiêu)
 *     tags: [Goals]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID của mục tiêu
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               targetAmount:
 *                 type: number
 *               deadline:
 *                 type: string
 *                 format: date
 *                 nullable: true
 *               colorCode:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [IN_PROGRESS, ACHIEVED]
 *           example:
 *             name: "Mua MacBook Pro M4"
 *             targetAmount: 45000000
 *     responses:
 *       200:
 *         description: Cập nhật mục tiêu thành công
 *         content:
 *           application/json:
 *             example:
 *               status: success
 *               message: Cập nhật mục tiêu thành công
 *       404:
 *         description: Không tìm thấy mục tiêu (GOAL_NOT_FOUND)
 */
router.put('/:id', validateUpdateGoal, goalController.updateGoal);

/**
 * @swagger
 * /api/goals/{id}/deposit:
 *   post:
 *     summary: Nạp tiền vào mục tiêu từ ví cá nhân
 *     description: |
 *       Chuyển một khoản tiền từ ví cá nhân vào mục tiêu tiết kiệm.
 *
 *       **Quy tắc:**
 *       - `wallet_id` phải là ví cá nhân của chính user (không dùng ví gia đình)
 *       - Số dư ví phải đủ để nạp
 *       - Sau khi nạp, số dư ví sẽ bị trừ và `currentAmount` của mục tiêu tăng lên
 *       - Nếu `currentAmount >= targetAmount`, trạng thái tự động chuyển sang ACHIEVED
 *     tags: [Goals]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID của mục tiêu cần nạp
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, wallet_id]
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *                 example: 5000000
 *                 description: Số tiền muốn nạp (VND)
 *               wallet_id:
 *                 type: string
 *                 format: uuid
 *                 example: "11111111-1111-1111-1111-111111111111"
 *                 description: UUID ví cá nhân nguồn tiền
 *           example:
 *             amount: 5000000
 *             wallet_id: "11111111-1111-1111-1111-111111111111"
 *     responses:
 *       200:
 *         description: Nạp tiền vào mục tiêu thành công
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
 *                     currentAmount:
 *                       type: number
 *                     status:
 *                       type: string
 *                     sourceWallet:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         balance:
 *                           type: number
 *             example:
 *               status: success
 *               message: Nạp tiền vào mục tiêu thành công
 *               data:
 *                 id: "g1a2b3c4-..."
 *                 currentAmount: 17000000
 *                 status: IN_PROGRESS
 *                 sourceWallet:
 *                   id: "11111111-..."
 *                   balance: 8000000
 *       403:
 *         description: Ví không phải ví cá nhân hợp lệ (INVALID_WALLET)
 *       404:
 *         description: Mục tiêu không tồn tại (GOAL_NOT_FOUND)
 */
router.post('/:id/deposit', validateDepositGoal, goalController.deposit);

/**
 * @swagger
 * /api/goals/{id}:
 *   delete:
 *     summary: Xóa mục tiêu tiết kiệm
 *     description: |
 *       Xóa vĩnh viễn một mục tiêu. Hành động này không thể hoàn tác.
 *
 *       **Lưu ý:** Số tiền đã nạp vào mục tiêu sẽ **không** được hoàn lại tự động.
 *       Nếu muốn lấy lại tiền, hãy rút trước khi xóa.
 *     tags: [Goals]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID của mục tiêu cần xóa
 *     responses:
 *       200:
 *         description: Xóa mục tiêu thành công
 *         content:
 *           application/json:
 *             example:
 *               status: success
 *               message: Xóa mục tiêu thành công
 *       404:
 *         description: Không tìm thấy mục tiêu (GOAL_NOT_FOUND)
 */
router.delete('/:id', validateDeleteGoal, goalController.deleteGoal);

module.exports = router;
