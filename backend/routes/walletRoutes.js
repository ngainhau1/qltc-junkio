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
 *   description: Quan ly vi ca nhan va vi gia dinh
 */

/**
 * @swagger
 * /api/wallets:
 *   get:
 *     summary: Lay danh sach vi ma user co quyen truy cap
 *     tags: [Wallets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sach vi thanh cong
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
 *     summary: Tao vi moi
 *     description: Bo qua family_id de tao vi ca nhan. Gui family_id de tao vi gia dinh trong family ma ban duoc phep truy cap.
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
 *                 example: Vi MB Bank
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
 *               summary: Tao vi ca nhan
 *               value:
 *                 name: Vi MB Bank
 *                 balance: 10000000
 *                 currency: VND
 *             family:
 *               summary: Tao vi gia dinh
 *               value:
 *                 name: Quy sinh hoat
 *                 balance: 5000000
 *                 currency: VND
 *                 family_id: 11111111-1111-1111-1111-111111111111
 *     responses:
 *       201:
 *         description: Tao vi thanh cong
 *       409:
 *         description: Ten vi da ton tai trong cung scope
 *       422:
 *         description: Du lieu khong hop le
 */
router.post('/', validateCreateWallet, walletController.createWallet);

/**
 * @swagger
 * /api/wallets/{id}:
 *   put:
 *     summary: Cap nhat thong tin vi
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
 *                 example: Vi Luong
 *               balance:
 *                 type: number
 *                 example: 2500000
 *               currency:
 *                 type: string
 *                 enum: [VND, USD, EUR]
 *     responses:
 *       200:
 *         description: Cap nhat vi thanh cong
 *       404:
 *         description: Khong tim thay vi
 */
router.put('/:id', validateUpdateWallet, walletController.updateWallet);

/**
 * @swagger
 * /api/wallets/{id}:
 *   delete:
 *     summary: Xoa vi
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
 *         description: Xoa vi thanh cong
 *       404:
 *         description: Khong tim thay vi
 */
router.delete('/:id', validateDeleteWallet, walletController.deleteWallet);

module.exports = router;
