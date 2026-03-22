const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const authMiddleware = require('../middleware/authMiddleware');
const {
    validateCreateWallet,
    validateUpdateWallet,
    validateDeleteWallet
} = require('../validators/walletValidator');

router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Wallets
 *   description: Quản lý ví tiền
 */

/**
 * @swagger
 * /api/wallets:
 *   get:
 *     summary: Lấy danh sách ví của người dùng
 *     tags: [Wallets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách ví
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
 *                   balance:
 *                     type: number
 *                   currency:
 *                     type: string
 *                     example: VND
 *       401:
 *         description: Chưa xác thực
 */
router.get('/', walletController.getUserWallets);

/**
 * @swagger
 * /api/wallets:
 *   post:
 *     summary: Tạo ví mới
 *     tags: [Wallets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Ví Tiết Kiệm
 *               balance:
 *                 type: number
 *                 example: 0
 *               currency:
 *                 type: string
 *                 example: VND
 *     responses:
 *       201:
 *         description: Tạo ví thành công
 *       401:
 *         description: Chưa xác thực
 */
router.post('/', validateCreateWallet, walletController.createWallet);

/**
 * @swagger
 * /api/wallets/{id}:
 *   put:
 *     summary: Cập nhật thông tin ví
 *     tags: [Wallets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               balance:
 *                 type: number
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Không tìm thấy ví
 */
router.put('/:id', validateUpdateWallet, walletController.updateWallet);

/**
 * @swagger
 * /api/wallets/{id}:
 *   delete:
 *     summary: Xóa ví
 *     tags: [Wallets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       404:
 *         description: Không tìm thấy ví
 */
router.delete('/:id', validateDeleteWallet, walletController.deleteWallet);

module.exports = router;

