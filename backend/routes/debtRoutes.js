const express = require('express');
const router = express.Router();
const debtController = require('../controllers/debtController');
const auth = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Debts
 *   description: Quản lý chia sẻ chi phí / nợ
 */

// @route   GET /api/debts/pending
// @desc    Get all unresolved assigned debts for the logged-in user
// @access  Private
/**
 * @swagger
 * /api/debts/pending:
 *   get:
 *     summary: Lấy danh sách khoản chia chưa xử lý
 *     tags: [Debts]
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       200: { description: Danh sách pending shares }
 */
router.get('/pending', auth, debtController.getPendingDebts);

// @route   PUT /api/debts/:shareId/approve
// @desc    Accept to take on a debt share
// @access  Private
/**
 * @swagger
 * /api/debts/{shareId}/approve:
 *   put:
 *     summary: Chấp nhận chia tiền
 *     tags: [Debts]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: shareId
 *         required: true
 *     responses:
 *       200: { description: Đã chấp nhận }
 */
router.put('/:shareId/approve', auth, debtController.approveShare);

// @route   PUT /api/debts/:shareId/reject
// @desc    Reject a false debt share 
// @access  Private
/**
 * @swagger
 * /api/debts/{shareId}/reject:
 *   put:
 *     summary: Từ chối khoản chia
 *     tags: [Debts]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: shareId
 *         required: true
 *     responses:
 *       200: { description: Đã từ chối }
 */
router.put('/:shareId/reject', auth, debtController.rejectShare);

// @route   POST /api/debts/settle
// @desc    Settle debt with a friend through internal transfer
// @access  Private
/**
 * @swagger
 * /api/debts/settle:
 *   post:
 *     summary: Tất toán nợ qua chuyển khoản nội bộ
 *     tags: [Debts]
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       200: { description: Thành công }
 */
router.post('/settle', auth, debtController.settleDebt);

// @route   GET /api/debts/simplified/:familyId
// @desc    Get optimized debt settlement suggestions (Greedy Algorithm)
// @access  Private
/**
 * @swagger
 * /api/debts/simplified/{familyId}:
 *   get:
 *     summary: Gợi ý tối ưu thanh toán nợ trong gia đình
 *     tags: [Debts]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: familyId
 *         required: true
 *     responses:
 *       200: { description: Danh sách gợi ý } 
 */
router.get('/simplified/:familyId', auth, debtController.getSimplifiedDebts);

module.exports = router;
