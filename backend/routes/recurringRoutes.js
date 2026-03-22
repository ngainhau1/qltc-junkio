const express = require('express');
const router = express.Router();
const recurringController = require('../controllers/recurringController');
const authMiddleware = require('../middleware/authMiddleware');
const { validateCreateRecurring, validateUpdateRecurring, validateDeleteRecurring } = require('../validators/recurringValidator');

router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Recurring
 *   description: Giao dịch định kỳ / cron
 */

/**
 * @swagger
 * /api/recurring:
 *   get:
 *     summary: Lấy danh sách mẫu giao dịch định kỳ
 *     tags: [Recurring]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách patterns
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   amount:
 *                     type: number
 *                   frequency:
 *                     type: string
 *                     enum: [DAILY, WEEKLY, MONTHLY, YEARLY]
 *                   next_run_date:
 *                     type: string
 *                     format: date
 *                   is_active:
 *                     type: boolean
 */
router.get('/', recurringController.getPatterns);

/**
 * @swagger
 * /api/recurring:
 *   post:
 *     summary: Tạo mẫu giao dịch định kỳ
 *     tags: [Recurring]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [wallet_id, amount, frequency, next_run_date]
 *             properties:
 *               wallet_id:
 *                 type: string
 *                 format: uuid
 *               category_id:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *               amount:
 *                 type: number
 *                 example: 300000
 *               type:
 *                 type: string
 *                 enum: [INCOME, EXPENSE]
 *                 default: EXPENSE
 *               description:
 *                 type: string
 *                 example: Tiền điện hàng tháng
 *               frequency:
 *                 type: string
 *                 enum: [DAILY, WEEKLY, MONTHLY, YEARLY]
 *                 example: MONTHLY
 *               next_run_date:
 *                 type: string
 *                 format: date
 *                 example: "2026-04-01"
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       400:
 *         description: Thiếu trường bắt buộc
 */
router.post('/', validateCreateRecurring, recurringController.createPattern);

/**
 * @swagger
 * /api/recurring/trigger-cron:
 *   post:
 *     summary: Kích hoạt cron xử lý giao dịch định kỳ ngay lập tức
 *     tags: [Recurring]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Kết quả cron
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Đã chạy thành công 3 giao dịch định kỳ.
 */
router.post('/trigger-cron', recurringController.triggerCron);

/**
 * @swagger
 * /api/recurring/{id}:
 *   put:
 *     summary: Cập nhật mẫu giao dịch định kỳ
 *     tags: [Recurring]
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
 *               amount:
 *                 type: number
 *               frequency:
 *                 type: string
 *                 enum: [DAILY, WEEKLY, MONTHLY, YEARLY]
 *               is_active:
 *                 type: boolean
 *               next_run_date:
 *                 type: string
 *                 format: date
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Không tìm thấy pattern
 */
router.put('/:id', validateUpdateRecurring, recurringController.updatePattern);

/**
 * @swagger
 * /api/recurring/{id}:
 *   delete:
 *     summary: Xóa mẫu giao dịch định kỳ
 *     tags: [Recurring]
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
 *         description: Xóa thành công
 *       404:
 *         description: Không tìm thấy pattern
 */
router.delete('/:id', validateDeleteRecurring, recurringController.deletePattern);

module.exports = router;
