const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const ctrl = require('../controllers/forecastController');

/**
 * @swagger
 * tags:
 *   name: Forecast
 *   description: |
 *     Dự báo dòng tiền dựa trên dữ liệu lịch sử.
 *     Sử dụng thuật toán phân tích xu hướng thu/chi trong quá khứ
 *     để dự đoán tình hình tài chính trong các tháng tới.
 */

/**
 * @swagger
 * /api/forecast:
 *   get:
 *     summary: Dự báo thu/chi trong tương lai
 *     description: |
 *       Phân tích dữ liệu giao dịch lịch sử và dự đoán thu nhập / chi tiêu
 *       cho các tháng tiếp theo.
 *
 *       **Cách hoạt động:**
 *       1. Hệ thống lấy dữ liệu giao dịch 6 tháng gần nhất
 *       2. Tính trung bình thu/chi theo tháng
 *       3. Áp dụng mô hình xu hướng tuyến tính để dự đoán
 *
 *       **Tham số:**
 *       - `months`: Số tháng muốn dự báo (mặc định 3, tối đa 12)
 *     tags: [Forecast]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: query
 *         name: months
 *         schema:
 *           type: integer
 *           default: 3
 *         description: Số tháng muốn dự báo (1-12)
 *     responses:
 *       200:
 *         description: Kết quả dự báo thành công
 *         content:
 *           application/json:
 *             example:
 *               status: success
 *               message: Dự báo dòng tiền thành công
 *               data:
 *                 forecast:
 *                   - month: "2026-04"
 *                     predictedIncome: 28000000
 *                     predictedExpense: 18500000
 *                     netFlow: 9500000
 *                   - month: "2026-05"
 *                     predictedIncome: 28500000
 *                     predictedExpense: 19000000
 *                     netFlow: 9500000
 *                   - month: "2026-06"
 *                     predictedIncome: 29000000
 *                     predictedExpense: 19500000
 *                     netFlow: 9500000
 *                 confidence: 0.82
 */
router.get('/', auth, ctrl.getForecast);

module.exports = router;
