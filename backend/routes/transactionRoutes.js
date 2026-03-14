const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Transactions
 *   description: Quản lý giao dịch thu/chi/chuyển khoản
 */

/**
 * @swagger
 * /api/transactions:
 *   get:
 *     summary: Lấy danh sách giao dịch (có phân trang và lọc)
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số bản ghi mỗi trang
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [INCOME, EXPENSE, TRANSFER]
 *         description: Lọc theo loại giao dịch
 *     responses:
 *       200:
 *         description: Danh sách giao dịch
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 transactions:
 *                   type: array
 *                 totalItems:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *       401:
 *         description: Chưa xác thực
 */
router.get('/', authMiddleware, transactionController.getTransactions);

/**
 * @swagger
 * /api/transactions:
 *   post:
 *     summary: Tạo giao dịch mới (Thu nhập hoặc Chi phí)
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [wallet_id, amount, type]
 *             properties:
 *               wallet_id:
 *                 type: string
 *                 format: uuid
 *                 example: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
 *               amount:
 *                 type: number
 *                 example: 150000
 *               type:
 *                 type: string
 *                 enum: [INCOME, EXPENSE]
 *                 example: EXPENSE
 *               description:
 *                 type: string
 *                 example: "Cà phê buổi sáng"
 *               category_id:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2026-03-14"
 *     responses:
 *       201:
 *         description: Tạo giao dịch thành công
 *       400:
 *         description: Dữ liệu không hợp lệ (amount âm, thiếu wallet_id...)
 *       401:
 *         description: Chưa xác thực
 */
router.post('/', authMiddleware, transactionController.createTransaction);

// Chuyển khoản (Transfer)
router.post('/transfer', authMiddleware, transactionController.createTransfer);

// Nhập dữ liệu (Import CSV)
router.post('/import', authMiddleware, transactionController.importTransactions);

// Xuất dữ liệu (Export CSV/PDF)
router.get('/export', authMiddleware, transactionController.exportTransactions);

/**
 * @swagger
 * /api/transactions/{id}:
 *   get:
 *     summary: Lấy chi tiết một giao dịch
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của giao dịch
 *     responses:
 *       200:
 *         description: Chi tiết giao dịch (bao gồm Wallet, Category, Shares)
 *       404:
 *         description: Không tìm thấy giao dịch
 *       401:
 *         description: Chưa xác thực
 */
router.get('/:id', authMiddleware, transactionController.getTransactionById);

/**
 * @swagger
 * /api/transactions/{id}:
 *   delete:
 *     summary: Xóa giao dịch
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của giao dịch cần xóa
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       404:
 *         description: Không tìm thấy giao dịch
 *       401:
 *         description: Chưa xác thực
 */
router.delete('/:id', authMiddleware, transactionController.deleteTransaction);

module.exports = router;

