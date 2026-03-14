const express = require('express');
const router = express.Router();
const recurringController = require('../controllers/recurringController');
const authMiddleware = require('../middleware/authMiddleware');

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
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       200: { description: Danh sách patterns }
 */
router.get('/', recurringController.getPatterns);

/**
 * @swagger
 * /api/recurring:
 *   post:
 *     summary: Tạo mẫu giao dịch định kỳ
 *     tags: [Recurring]
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       201: { description: Tạo thành công }
 */
router.post('/', recurringController.createPattern);

/**
 * @swagger
 * /api/recurring/trigger-cron:
 *   post:
 *     summary: Kích hoạt cron xử lý giao dịch định kỳ ngay
 *     tags: [Recurring]
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       200: { description: Cron triggered }
 */
router.post('/trigger-cron', recurringController.triggerCron);

/**
 * @swagger
 * /api/recurring/{id}:
 *   put:
 *     summary: Cập nhật mẫu giao dịch định kỳ
 *     tags: [Recurring]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200: { description: Cập nhật thành công }
 */
router.put('/:id', recurringController.updatePattern);

/**
 * @swagger
 * /api/recurring/{id}:
 *   delete:
 *     summary: Xóa mẫu giao dịch định kỳ
 *     tags: [Recurring]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200: { description: Xóa thành công }
 */
router.delete('/:id', recurringController.deletePattern);

module.exports = router;
