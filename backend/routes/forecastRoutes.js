const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const ctrl = require('../controllers/forecastController');

// @route   GET /api/forecast?months=3
// @desc    Get cash flow forecast based on historical data
// @access  Private
router.get('/', auth, ctrl.getForecast);

module.exports = router;
