const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: |
 *     Báo cáo và thống kê tài chính cá nhân.
 *     Cung cấp dữ liệu tổng quan (dashboard) và báo cáo chi tiết
 *     theo tháng/năm để người dùng theo dõi tình hình tài chính.
 */

/**
 * @swagger
 * /api/analytics/dashboard:
 *   get:
 *     summary: Lấy số liệu tổng quan tài chính cá nhân
 *     description: |
 *       Trả về dữ liệu tổng hợp cho trang Dashboard của người dùng:
 *       - **Tổng tài sản**: Tổng số dư tất cả ví cá nhân
 *       - **Thu nhập tháng này**: Tổng INCOME trong tháng hiện tại
 *       - **Chi tiêu tháng này**: Tổng EXPENSE trong tháng hiện tại
 *       - **Giao dịch gần đây**: 5-10 giao dịch mới nhất
 *
 *       API này được gọi mỗi khi người dùng mở trang chủ ứng dụng.
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thống kê dashboard thành công
 *         content:
 *           application/json:
 *             example:
 *               status: success
 *               data:
 *                 totalBalance: 45000000
 *                 monthlyIncome: 28000000
 *                 monthlyExpense: 15500000
 *                 recentTransactions:
 *                   - id: "t1-..."
 *                     amount: 150000
 *                     type: EXPENSE
 *                     description: "Cà phê buổi sáng"
 *                     date: "2026-03-30"
 *                   - id: "t2-..."
 *                     amount: 25000000
 *                     type: INCOME
 *                     description: "Lương tháng 3"
 *                     date: "2026-03-28"
 */
router.get('/dashboard', analyticsController.getDashboardStats);

/**
 * @swagger
 * /api/analytics/reports:
 *   get:
 *     summary: Lấy dữ liệu báo cáo tài chính theo tháng/năm
 *     description: |
 *       Trả về dữ liệu báo cáo chi tiết cho một tháng/năm cụ thể.
 *       Bao gồm: thống kê thu/chi theo danh mục, biểu đồ xu hướng,
 *       so sánh với tháng trước.
 *
 *       Nếu không truyền tham số, mặc định trả về dữ liệu tháng hiện tại.
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Năm cần xem báo cáo (VD 2026)
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *         description: Tháng cần xem báo cáo (1-12)
 *     responses:
 *       200:
 *         description: Dữ liệu báo cáo thành công
 *         content:
 *           application/json:
 *             example:
 *               status: success
 *               data:
 *                 year: 2026
 *                 month: 3
 *                 totalIncome: 28000000
 *                 totalExpense: 15500000
 *                 categoryBreakdown:
 *                   - category: "Ăn uống"
 *                     amount: 4500000
 *                     percentage: 29
 *                   - category: "Di chuyển"
 *                     amount: 3200000
 *                     percentage: 21
 */
router.get('/reports', analyticsController.getReports);

module.exports = router;
