const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const ctrl = require('../controllers/forecastController');
const { validateForecastQuery } = require('../validators/forecastValidator');

/**
 * @swagger
 * tags:
 *   name: Forecast
 *   description: Forecast cashflow trends from the user's historical transactions.
 */

/**
 * @swagger
 * /api/forecast:
 *   get:
 *     summary: Load the standard forecast dataset
 *     description: Returns historical monthly income/expense totals plus forward-looking predictions.
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
 *         description: Number of future months to forecast
 *     responses:
 *       200:
 *         description: Forecast loaded successfully
 */
router.get('/', auth, validateForecastQuery, ctrl.getForecast);

/**
 * @swagger
 * /api/forecast/ml:
 *   get:
 *     summary: Load the AI/ML forecast dataset
 *     description: Uses simple linear regression on the last 6 months of transaction history.
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
 *         description: Number of future months to forecast
 *     responses:
 *       200:
 *         description: ML forecast loaded successfully
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
