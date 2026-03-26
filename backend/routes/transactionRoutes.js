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
 *   description: Quan ly giao dich thu chi, chuyen tien, import va export
 */

/**
 * @swagger
 * /api/transactions:
 *   get:
 *     summary: Lay danh sach giao dich co phan trang va filter
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: context
 *         schema:
 *           type: string
 *           enum: [personal, family]
 *         description: Chon ngu canh du lieu can xem
 *       - in: query
 *         name: family_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [INCOME, EXPENSE, TRANSFER_IN, TRANSFER_OUT]
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: wallet_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tim theo description
 *     responses:
 *       200:
 *         description: Danh sach giao dich thanh cong
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
 */
router.get('/', authMiddleware, validateTransactionQuery, transactionController.getTransactions);

/**
 * @swagger
 * /api/transactions:
 *   post:
 *     summary: Tao giao dich moi
 *     description: Can co it nhat mot vi hop le truoc khi tao giao dich. wallet_id phai thuoc vi ma user co quyen truy cap.
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
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *                 example: 150000
 *               type:
 *                 type: string
 *                 enum: [INCOME, EXPENSE]
 *                 example: EXPENSE
 *               description:
 *                 type: string
 *                 example: Cafe buoi sang
 *               category_id:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *               date:
 *                 type: string
 *                 format: date
 *                 example: 2026-03-14
 *     responses:
 *       201:
 *         description: Tao giao dich thanh cong
 *       400:
 *         description: Chua co vi hoac so du vi khong du
 *       422:
 *         description: Du lieu body khong hop le
 */
router.post('/', authMiddleware, validateTransactionCreate, transactionController.createTransaction);

/**
 * @swagger
 * /api/transactions/transfer:
 *   post:
 *     summary: Chuyen tien giua hai vi
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
 *               to_wallet_id:
 *                 type: string
 *                 format: uuid
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *                 example: 500000
 *               description:
 *                 type: string
 *                 example: Chuyen tien tiet kiem
 *               date:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Chuyen tien thanh cong
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
 *       400:
 *         description: Chua co vi hop le hoac so du khong du
 */
router.post('/transfer', authMiddleware, validateTransactionTransfer, transactionController.createTransfer);

/**
 * @swagger
 * /api/transactions/import:
 *   post:
 *     summary: Import nhieu giao dich
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
 *     responses:
 *       200:
 *         description: Import thanh cong
 *       400:
 *         description: Danh sach rong hoac user chua co vi hop le
 */
router.post('/import', authMiddleware, validateTransactionImport, transactionController.importTransactions);

/**
 * @swagger
 * /api/transactions/export:
 *   get:
 *     summary: Export giao dich theo dung bo filter dang dung
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
 *       - in: query
 *         name: context
 *         schema:
 *           type: string
 *           enum: [personal, family]
 *       - in: query
 *         name: family_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [INCOME, EXPENSE, TRANSFER_IN, TRANSFER_OUT]
 *       - in: query
 *         name: wallet_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File export thanh cong
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
 *     summary: Lay chi tiet mot giao dich trong scope duoc phep
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
 *     responses:
 *       200:
 *         description: Chi tiet giao dich thanh cong
 *       404:
 *         description: Khong tim thay giao dich trong scope truy cap
 */
router.get('/:id', authMiddleware, validateTransactionParams, transactionController.getTransactionById);

/**
 * @swagger
 * /api/transactions/{id}:
 *   delete:
 *     summary: Xoa giao dich va hoan tac so du vi
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
 *     responses:
 *       200:
 *         description: Xoa giao dich thanh cong
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
 *       404:
 *         description: Khong tim thay giao dich trong scope truy cap
 */
router.delete('/:id', authMiddleware, validateTransactionParams, transactionController.deleteTransaction);

module.exports = router;
