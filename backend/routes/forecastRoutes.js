const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const ctrl = require('../controllers/forecastController');

/**
 * @swagger
 * tags:
 *   name: Forecast
 *   description: Dự báo dòng tiền
 */

// @route   GET /api/forecast?months=3
// @desc    Get cash flow forecast based on historical data
// @access  Private
/**
 * @swagger
 * /api/forecast:
 *   get:
 *     summary: Dự báo thu/chi trong tương lai
 *     tags: [Forecast]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: query
 *         name: months
 *         schema: { type: integer, default: 3 }
 *     responses:
 *       200: { description: Kết quả dự báo }
 */
router.get('/', auth, ctrl.getForecast);

module.exports = router;
