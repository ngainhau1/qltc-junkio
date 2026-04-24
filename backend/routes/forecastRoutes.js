const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const ctrl = require('../controllers/forecastController');
const { validateForecastQuery } = require('../validators/forecastValidator');

/**
 * @swagger
 * tags:
 *   name: Forecast
 *   description: Dự báo xu hướng dòng tiền dựa trên lịch sử giao dịch của người dùng.
 */

/**
 * @swagger
 * /api/forecast:
 *   get:
 *     summary: Lấy dữ liệu dự báo dòng tiền tiêu chuẩn
 *     description: Trả về tổng thu/chi theo tháng trong quá khứ cùng dữ liệu dự báo cho các tháng tiếp theo.
 *     tags: [Forecast]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: query
 *         name: months
 *         schema:
 *           type: integer
 *           default: 3
 *           minimum: 1
 *           maximum: 12
 *         description: Số tháng tương lai cần dự báo
 *     responses:
 *       200:
 *         description: Lấy dữ liệu dự báo thành công
 */
router.get('/', auth, validateForecastQuery, ctrl.getForecast);

/**
 * @swagger
 * /api/forecast/ml:
 *   get:
 *     summary: Lấy dữ liệu dự báo AI/ML
 *     description: Sử dụng hồi quy tuyến tính đơn giản trên lịch sử giao dịch 6 tháng gần nhất.
 *     tags: [Forecast]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: query
 *         name: months
 *         schema:
 *           type: integer
 *           default: 3
 *           minimum: 1
 *           maximum: 12
 *         description: Số tháng tương lai cần dự báo
 *     responses:
 *       200:
 *         description: Lấy dữ liệu dự báo ML thành công
 *         content:
 *           application/json:
 *             example:
 *               status: success
 *               message: FORECAST_ML_RETRIEVED
 *               data:
 *                 historical:
 *                   - month: "2026-01"
 *                     income: 28000000
 *                     expense: 18500000
 *                 forecast:
 *                   - month: "2026-07"
 *                     predictedIncome: 29000000
 *                     predictedExpense: 19500000
 *                     predictedNet: 9500000
 *                 warningMonth: null
 *                 model:
 *                   type: SIMPLE_LINEAR_REGRESSION
 *                   sourceMonths: 6
 *                   forecastMonths: 3
 */
router.get('/ml', auth, validateForecastQuery, ctrl.getMLForecast);

module.exports = router;
