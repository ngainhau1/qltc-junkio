const express = require('express');
const router = express.Router();
const debtController = require('../controllers/debtController');
const auth = require('../middleware/authMiddleware');
const { validateSettle, validateShareParam } = require('../validators/debtValidator');

/**
 * @swagger
 * tags:
 *   name: Debts
 *   description: |
 *     Quản lý chia sẻ chi phí và nợ trong nhóm gia đình.
 *     Khi một thành viên gia đình tạo giao dịch chi tiêu chung,
 *     hệ thống tự động chia đều cho các thành viên và tạo khoản nợ.
 *     Mỗi thành viên có thể chấp nhận/từ chối khoản chia, và tất toán nợ.
 */

/**
 * @swagger
 * /api/debts/pending:
 *   get:
 *     summary: Lấy danh sách khoản chia tiền đang chờ xử lý
 *     description: |
 *       Trả về các khoản chia tiền mà người dùng hiện tại chưa xử lý
 *       (trạng thái PENDING). Đây là các khoản mà người khác đã tạo
 *       và chia phần cho bạn, cần bạn chấp nhận hoặc từ chối.
 *     tags: [Debts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách khoản chia chờ xử lý
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
 *                   approval_status:
 *                     type: string
 *                     enum: [PENDING, APPROVED, REJECTED]
 *             example:
 *               - id: "s1a2b3c4-..."
 *                 amount: 250000
 *                 approval_status: PENDING
 *                 from_user: "Nguyễn Văn A"
 *                 description: "Chia tiền ăn tối"
 *                 created_at: "2026-03-30T08:00:00.000Z"
 *               - id: "s2b3c4d5-..."
 *                 amount: 150000
 *                 approval_status: PENDING
 *                 from_user: "Trần Thị B"
 *                 description: "Chia tiền taxi"
 *                 created_at: "2026-03-29T20:00:00.000Z"
 */
router.get('/pending', auth, debtController.getPendingDebts);

/**
 * @swagger
 * /api/debts/{shareId}/approve:
 *   put:
 *     summary: Chấp nhận khoản chia tiền
 *     description: |
 *       Xác nhận rằng bạn đồng ý với khoản chia tiền này.
 *       Sau khi chấp nhận, khoản nợ sẽ được ghi nhận chính thức.
 *
 *       **Lưu ý:** Chỉ có thể duyệt khoản chia thuộc về chính mình.
 *     tags: [Debts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shareId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID của khoản chia tiền
 *     responses:
 *       200:
 *         description: Đã chấp nhận khoản chia
 *         content:
 *           application/json:
 *             example:
 *               status: success
 *               message: Đã chấp nhận khoản chia
 *       403:
 *         description: Không có quyền duyệt khoản chia này
 *       404:
 *         description: Không tìm thấy khoản chia (SHARE_NOT_FOUND)
 */
router.put('/:shareId/approve', auth, validateShareParam, debtController.approveShare);

/**
 * @swagger
 * /api/debts/{shareId}/reject:
 *   put:
 *     summary: Từ chối khoản chia tiền
 *     description: |
 *       Từ chối khoản chia tiền. Khoản nợ sẽ không được ghi nhận.
 *
 *       **Lưu ý:** Chỉ có thể từ chối khoản chia thuộc về chính mình.
 *     tags: [Debts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shareId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID của khoản chia tiền
 *     responses:
 *       200:
 *         description: Đã từ chối khoản chia
 *         content:
 *           application/json:
 *             example:
 *               status: success
 *               message: Đã từ chối khoản chia
 *       403:
 *         description: Không có quyền từ chối khoản chia này
 *       404:
 *         description: Không tìm thấy khoản chia (SHARE_NOT_FOUND)
 */
router.put('/:shareId/reject', auth, validateShareParam, debtController.rejectShare);

/**
 * @swagger
 * /api/debts/settle:
 *   post:
 *     summary: Tất toán nợ qua chuyển khoản nội bộ
 *     description: |
 *       Thanh toán khoản nợ bằng cách chuyển tiền trực tiếp giữa 2 ví trong hệ thống.
 *       Hệ thống sẽ tạo 2 giao dịch (TRANSFER_OUT / TRANSFER_IN) và đánh dấu nợ đã thanh toán.
 *
 *       **Yêu cầu:**
 *       - Ví nguồn (`from_wallet_id`) phải có đủ số dư
 *       - Ví đích (`to_wallet_id`) phải thuộc người nhận thanh toán
 *     tags: [Debts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [to_user_id, amount, from_wallet_id, to_wallet_id]
 *             properties:
 *               to_user_id:
 *                 type: string
 *                 format: uuid
 *                 description: UUID người nhận thanh toán
 *               from_user_id:
 *                 type: string
 *                 format: uuid
 *                 description: Deprecated in family mode; debtor is derived from the authenticated user
 *               amount:
 *                 type: number
 *                 example: 250000
 *                 description: Số tiền tất toán (VND)
 *               from_wallet_id:
 *                 type: string
 *                 format: uuid
 *                 description: UUID ví người trả (ví của bạn)
 *               to_wallet_id:
 *                 type: string
 *                 format: uuid
 *                 description: UUID ví người nhận
 *               family_id:
 *                 type: string
 *                 format: uuid
 *                 description: Family id for member-to-member shared expense settlement
 *           example:
 *             to_user_id: "u-receiver-1234-..."
 *             amount: 250000
 *             from_wallet_id: "w-my-wallet-..."
 *             to_wallet_id: "w-their-wallet-..."
 *             family_id: "family-1234-..."
 *     responses:
 *       200:
 *         description: Tất toán nợ thành công
 *         content:
 *           application/json:
 *             example:
 *               status: success
 *               message: Tất toán nợ thành công
 *       400:
 *         description: Số dư không đủ hoặc dữ liệu không hợp lệ (INSUFFICIENT_BALANCE)
 */
router.post('/settle', auth, validateSettle, debtController.settleDebt);

/**
 * @swagger
 * /api/debts/simplified/{familyId}:
 *   get:
 *     summary: Gợi ý tối ưu thanh toán nợ trong gia đình
 *     description: |
 *       Sử dụng thuật toán Greedy để tính toán cách thanh toán nợ **tối ưu nhất**
 *       giữa các thành viên trong một gia đình. Giảm thiểu số lượng giao dịch cần thực hiện.
 *
 *       **Ví dụ:** Nếu A nợ B 100k, B nợ C 100k -> Gợi ý: A chuyển thẳng cho C 100k
 *       (giảm từ 2 giao dịch xuống 1).
 *     tags: [Debts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: familyId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID gia đình cần tối ưu nợ
 *     responses:
 *       200:
 *         description: Danh sách gợi ý thanh toán tối ưu
 *         content:
 *           application/json:
 *             example:
 *               status: success
 *               data:
 *                 - from: "Nguyễn Văn A"
 *                   to: "Trần Thị B"
 *                   amount: 350000
 *                 - from: "Lê Văn C"
 *                   to: "Trần Thị B"
 *                   amount: 150000
 */
router.get('/simplified/:familyId', auth, debtController.getSimplifiedDebts);

module.exports = router;
