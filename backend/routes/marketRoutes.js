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
 *         content:
 *           application/json:
 *             example:
 *               status: success
 *               message: GOLD_PRICE_FETCHED
 *               data:
 *                 source: sjc
 *                 branch: Hồ Chí Minh
 *                 productName: Vàng SJC 1L, 10L, 1KG
 *                 buy: 168500000
 *                 sell: 172000000
 *                 currency: VND
 *                 unit: VND_PER_LUONG
 *                 updatedAt: 2026-04-16T13:52:00+07:00
 *                 updatedLabel: 13:52 16/04/2026
 *       502:
 *         description: Upstream gold price service failed
 */
router.get('/gold', marketController.getGoldPrice);

module.exports = router;
