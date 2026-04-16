const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const marketController = require('../controllers/marketController');

router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Market
 *   description: Market data widgets and integrations for the authenticated dashboard.
 */

/**
 * @swagger
 * /api/market/gold:
 *   get:
 *     summary: Load the latest live SJC gold price for the dashboard widget
 *     description: Proxies the live SJC price service, normalizes the selected Ho Chi Minh City SJC record, and caches it in Redis for 60 seconds.
 *     tags: [Market]
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       200:
 *         description: Gold price loaded successfully
 *       502:
 *         description: Upstream gold price service failed
 */
router.get('/gold', marketController.getGoldPrice);

/**
 * @swagger
 * /api/market/gold/history:
 *   get:
 *     summary: Load the cached SJC gold price history for the dashboard chart
 *     description: Returns the locally stored SJC history for the selected range. Live snapshots take precedence over demo-seeded points at the same timestamp.
 *     tags: [Market]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: query
 *         name: range
 *         required: true
 *         schema:
 *           type: string
 *           enum: [24H, 7D]
 *     responses:
 *       200:
 *         description: Gold price history loaded successfully
 *       400:
 *         description: Invalid history range
 *       500:
 *         description: Gold price history failed to load
 */
router.get('/gold/history', marketController.getGoldPriceHistory);

module.exports = router;
