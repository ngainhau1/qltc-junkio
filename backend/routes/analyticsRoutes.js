const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Báo cáo và thống kê người dùng
 */

/**
 * @swagger
 * /api/analytics/dashboard:
 *   get:
 *     summary: Lấy số liệu tổng quan (tài sản, thu/chi tháng, giao dịch gần đây)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thống kê dashboard
 */
router.get('/dashboard', analyticsController.getDashboardStats);

/**
 * @swagger
 * /api/analytics/reports:
 *   get:
 *     summary: Lấy dữ liệu báo cáo tuỳ chọn (placeholder)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema: { type: integer }
 *       - in: query
 *         name: month
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Dữ liệu báo cáo
 */
router.get('/reports', analyticsController.getReports);

module.exports = router;
