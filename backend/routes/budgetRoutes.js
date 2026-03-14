const express = require('express');
const router = express.Router();
const budgetController = require('../controllers/budgetController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Budgets
 *   description: Quản lý ngân sách theo danh mục
 */

/**
 * @swagger
 * /api/budgets:
 *   get:
 *     summary: Lấy danh sách ngân sách
 *     tags: [Budgets]
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       200: { description: Danh sách ngân sách }
 */
router.get('/', budgetController.getBudgets);

/**
 * @swagger
 * /api/budgets:
 *   post:
 *     summary: Tạo ngân sách mới
 *     tags: [Budgets]
 *     security: [ { bearerAuth: [] } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [category_id, amount_limit, start_date, end_date]
 *     responses:
 *       201: { description: Ngân sách được tạo }
 */
router.post('/', budgetController.createBudget);

/**
 * @swagger
 * /api/budgets/{id}:
 *   put:
 *     summary: Cập nhật ngân sách
 *     tags: [Budgets]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200: { description: Cập nhật thành công }
 */
router.put('/:id', budgetController.updateBudget);

/**
 * @swagger
 * /api/budgets/{id}:
 *   delete:
 *     summary: Xóa ngân sách
 *     tags: [Budgets]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200: { description: Xóa thành công }
 */
router.delete('/:id', budgetController.deleteBudget);

module.exports = router;
