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
 *   description: Quản lý mục tiêu tài chính
 */

/**
 * @swagger
 * /api/goals:
 *   get:
 *     summary: Lấy danh sách mục tiêu
 *     tags: [Goals]
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       200: { description: Danh sách goals }
 */
router.get('/', goalController.getGoals);

/**
 * @swagger
 * /api/goals:
 *   post:
 *     summary: Tạo mục tiêu mới
 *     tags: [Goals]
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       201: { description: Tạo thành công }
 */
router.post('/', validateCreateGoal, goalController.createGoal);

/**
 * @swagger
 * /api/goals/{id}:
 *   put:
 *     summary: Cập nhật mục tiêu
 *     tags: [Goals]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200: { description: Cập nhật thành công }
 */
router.put('/:id', validateUpdateGoal, goalController.updateGoal);

/**
 * @swagger
 * /api/goals/{id}/deposit:
 *   post:
 *     summary: Nạp tiền vào mục tiêu
 *     tags: [Goals]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200: { description: Nạp tiền thành công }
 */
router.post('/:id/deposit', validateDepositGoal, goalController.deposit);

/**
 * @swagger
 * /api/goals/{id}:
 *   delete:
 *     summary: Xóa mục tiêu
 *     tags: [Goals]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200: { description: Xóa thành công }
 */
router.delete('/:id', validateDeleteGoal, goalController.deleteGoal);

module.exports = router;
