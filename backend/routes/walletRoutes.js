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
 *   description: Quản lý ví cá nhân và ví gia đình
 */

/**
 * @swagger
 * /api/wallets:
 *   get:
 *     summary: Lấy danh sách ví mà người dùng có quyền truy cập
 *     tags: [Wallets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trả về danh sách ví thành công
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
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       name:
 *                         type: string
 *                       balance:
 *                         type: number
 *                       currency:
 *                         type: string
 *                         example: VND
 *                       user_id:
 *                         type: string
 *                         format: uuid
 *                         nullable: true
 *                       family_id:
 *                         type: string
 *                         format: uuid
 *                         nullable: true
 */
router.get('/', walletController.getUserWallets);

/**
 * @swagger
 * /api/wallets:
 *   post:
 *     summary: Tạo ví mới
 *     description: Bỏ qua \`family_id\` để tạo ví cá nhân. Gửi \`family_id\` để tạo ví gia đình trong gia đình mà bạn được phép quản lý.
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
 *                 example: Ví MB Bank
 *               balance:
 *                 type: number
 *                 example: 10000000
 *               currency:
 *                 type: string
 *                 enum: [VND, USD, EUR]
 *                 example: VND
 *               family_id:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *           examples:
 *             personal:
 *               summary: Tạo ví cá nhân (Personal Wallet)
 *               value:
 *                 name: Ví Cá Nhân ACB
 *                 balance: 15000000
 *                 currency: VND
 *             family:
 *               summary: Tạo ví gia đình (Family Wallet)
 *               value:
 *                 name: Quỹ Sinh Hoạt Chung
 *                 balance: 5000000
 *                 currency: VND
 *                 family_id: 11111111-1111-1111-1111-111111111111
 *     responses:
 *       201:
 *         description: Tạo ví mới thành công
 *       409:
 *         description: Tên ví đã tồn tại trong cùng danh mục
 *       422:
 *         description: Dữ liệu gửi lên không đúng định dạng
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
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Ví Lương Tháng
 *               balance:
 *                 type: number
 *                 example: 25000000
 *               currency:
 *                 type: string
 *                 enum: [VND, USD, EUR]
 *     responses:
 *       200:
 *         description: Cập nhật ví thành công
 *       404:
 *         description: Không tìm thấy ví tương ứng (WALLET_NOT_FOUND)
 */
router.put('/:id', validateUpdateWallet, walletController.updateWallet);

/**
 * @swagger
 * /api/wallets/{id}:
 *   delete:
 *     summary: Xóa ví vĩnh viễn
 *     tags: [Wallets]
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
 *         description: Xóa ví thành công
 *       404:
 *         description: Không tìm thấy ví
 */
router.delete('/:id', validateDeleteWallet, walletController.deleteWallet);

module.exports = router;
