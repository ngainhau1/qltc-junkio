const express = require('express');
const router = express.Router();
const debtController = require('../controllers/debtController');
const auth = require('../middleware/authMiddleware');
const { validateSettle, validateShareParam } = require('../validators/debtValidator');

/**
 * @swagger
 * tags:
 *   name: Debts
 *   description: Quản lý chia sẻ chi phí / nợ
 */

/**
 * @swagger
 * /api/debts/pending:
 *   get:
 *     summary: Lấy danh sách khoản chia chưa xử lý
 *     tags: [Debts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách pending shares
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
 */
router.get('/pending', auth, debtController.getPendingDebts);

/**
 * @swagger
 * /api/debts/{shareId}/approve:
 *   put:
 *     summary: Chấp nhận khoản chia tiền
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
 *         description: ID của khoản chia
 *     responses:
 *       200:
 *         description: Đã chấp nhận
 *       403:
 *         description: Không có quyền duyệt nợ thay người khác
 *       404:
 *         description: Không tìm thấy khoản nợ
 */
router.put('/:shareId/approve', auth, validateShareParam, debtController.approveShare);

/**
 * @swagger
 * /api/debts/{shareId}/reject:
 *   put:
 *     summary: Từ chối khoản chia tiền
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
 *         description: ID của khoản chia
 *     responses:
 *       200:
 *         description: Đã từ chối
 *       403:
 *         description: Không có quyền từ chối nợ thay người khác
 *       404:
 *         description: Không tìm thấy khoản nợ
 */
router.put('/:shareId/reject', auth, validateShareParam, debtController.rejectShare);

/**
 * @swagger
 * /api/debts/settle:
 *   post:
 *     summary: Tất toán nợ qua chuyển khoản nội bộ
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
 *                 description: ID người nhận thanh toán
 *               amount:
 *                 type: number
 *                 example: 250000
 *               from_wallet_id:
 *                 type: string
 *                 format: uuid
 *                 description: Ví người trả
 *               to_wallet_id:
 *                 type: string
 *                 format: uuid
 *                 description: Ví người nhận
 *     responses:
 *       200:
 *         description: Tất toán thành công
 *       400:
 *         description: Số dư không đủ hoặc dữ liệu không hợp lệ
 */
router.post('/settle', auth, validateSettle, debtController.settleDebt);

/**
 * @swagger
 * /api/debts/simplified/{familyId}:
 *   get:
 *     summary: Gợi ý tối ưu thanh toán nợ trong gia đình (Greedy Algorithm)
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
 *         description: ID gia đình cần tối ưu
 *     responses:
 *       200:
 *         description: Danh sách gợi ý thanh toán tối ưu
 */
router.get('/simplified/:familyId', auth, debtController.getSimplifiedDebts);

module.exports = router;
