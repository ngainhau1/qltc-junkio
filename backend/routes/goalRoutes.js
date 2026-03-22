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
 *   description: Quan ly muc tieu tai chinh ca nhan
 */

/**
 * @swagger
 * /api/goals:
 *   get:
 *     summary: Lay danh sach muc tieu cua user
 *     tags: [Goals]
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       200:
 *         description: Danh sach goals thanh cong
 */
router.get('/', goalController.getGoals);

/**
 * @swagger
 * /api/goals:
 *   post:
 *     summary: Tao muc tieu moi
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
 *                 example: Mua laptop moi
 *               targetAmount:
 *                 type: number
 *                 minimum: 0.01
 *                 example: 30000000
 *               deadline:
 *                 type: string
 *                 format: date
 *                 nullable: true
 *                 example: 2026-12-31
 *               colorCode:
 *                 type: string
 *                 example: '#16a34a'
 *               imageUrl:
 *                 type: string
 *                 example: Laptop
 *     responses:
 *       201:
 *         description: Tao goal thanh cong
 *       422:
 *         description: Du lieu body khong hop le
 */
router.post('/', validateCreateGoal, goalController.createGoal);

/**
 * @swagger
 * /api/goals/{id}:
 *   put:
 *     summary: Cap nhat muc tieu
 *     tags: [Goals]
 *     security: [ { bearerAuth: [] } ]
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
 *     responses:
 *       200:
 *         description: Cap nhat goal thanh cong
 *       404:
 *         description: Khong tim thay goal
 */
router.put('/:id', validateUpdateGoal, goalController.updateGoal);

/**
 * @swagger
 * /api/goals/{id}/deposit:
 *   post:
 *     summary: Nap tien vao goal tu vi ca nhan
 *     description: wallet_id phai la vi ca nhan thuoc chinh user. Khong duoc nap muc tieu bang family wallet.
 *     tags: [Goals]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
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
 *               wallet_id:
 *                 type: string
 *                 format: uuid
 *                 example: 11111111-1111-1111-1111-111111111111
 *     responses:
 *       200:
 *         description: Nap goal thanh cong
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
 *       403:
 *         description: wallet_id khong phai vi ca nhan hop le cua user
 */
router.post('/:id/deposit', validateDepositGoal, goalController.deposit);

/**
 * @swagger
 * /api/goals/{id}:
 *   delete:
 *     summary: Xoa muc tieu
 *     tags: [Goals]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Xoa goal thanh cong
 *       404:
 *         description: Khong tim thay goal
 */
router.delete('/:id', validateDeleteGoal, goalController.deleteGoal);

module.exports = router;
