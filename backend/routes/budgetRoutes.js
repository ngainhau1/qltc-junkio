const express = require('express');
const router = express.Router();
const budgetController = require('../controllers/budgetController');
const authMiddleware = require('../middleware/authMiddleware');
const {
    validateCreateBudget,
    validateUpdateBudget,
    validateDeleteBudget
} = require('../validators/budgetValidator');

router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Budgets
 *   description: Quan ly ngan sach ca nhan va ngan sach gia dinh
 */

/**
 * @swagger
 * /api/budgets:
 *   get:
 *     summary: Lay danh sach budget ma user co quyen xem
 *     description: Tra ve toan bo budget ca nhan cua user va budget gia dinh thuoc cac family ma user la thanh vien.
 *     tags: [Budgets]
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       200:
 *         description: Danh sach budget thanh cong
 */
router.get('/', budgetController.getBudgets);

/**
 * @swagger
 * /api/budgets:
 *   post:
 *     summary: Tao budget moi
 *     description: Bo qua family_id de tao personal budget. Gui family_id de tao family budget trong family ban dang tham gia.
 *     tags: [Budgets]
 *     security: [ { bearerAuth: [] } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [category_id, amount_limit, start_date, end_date]
 *             properties:
 *               category_id:
 *                 type: string
 *                 format: uuid
 *               amount_limit:
 *                 type: number
 *                 minimum: 0.01
 *                 example: 3000000
 *               start_date:
 *                 type: string
 *                 format: date
 *                 example: 2026-03-01
 *               end_date:
 *                 type: string
 *                 format: date
 *                 example: 2026-03-31
 *               family_id:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *           examples:
 *             personal:
 *               summary: Tao personal budget
 *               value:
 *                 category_id: 11111111-1111-1111-1111-111111111111
 *                 amount_limit: 3000000
 *                 start_date: 2026-03-01
 *                 end_date: 2026-03-31
 *             family:
 *               summary: Tao family budget
 *               value:
 *                 category_id: 11111111-1111-1111-1111-111111111111
 *                 amount_limit: 5000000
 *                 start_date: 2026-03-01
 *                 end_date: 2026-03-31
 *                 family_id: 22222222-2222-2222-2222-222222222222
 *     responses:
 *       201:
 *         description: Tao budget thanh cong
 *       403:
 *         description: User khong thuoc family duoc chi dinh
 *       422:
 *         description: Du lieu body khong hop le
 */
router.post('/', validateCreateBudget, budgetController.createBudget);

/**
 * @swagger
 * /api/budgets/{id}:
 *   put:
 *     summary: Cap nhat budget
 *     description: Gui family_id null de chuyen budget ve scope personal. Gui family_id hop le de chuyen sang family budget.
 *     tags: [Budgets]
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
 *               category_id:
 *                 type: string
 *                 format: uuid
 *               amount_limit:
 *                 type: number
 *                 minimum: 0.01
 *               start_date:
 *                 type: string
 *                 format: date
 *               end_date:
 *                 type: string
 *                 format: date
 *               family_id:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Cap nhat budget thanh cong
 *       404:
 *         description: Khong tim thay budget trong scope truy cap
 */
router.put('/:id', validateUpdateBudget, budgetController.updateBudget);

/**
 * @swagger
 * /api/budgets/{id}:
 *   delete:
 *     summary: Xoa budget
 *     tags: [Budgets]
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
 *         description: Xoa budget thanh cong
 *       404:
 *         description: Khong tim thay budget trong scope truy cap
 */
router.delete('/:id', validateDeleteBudget, budgetController.deleteBudget);

module.exports = router;
