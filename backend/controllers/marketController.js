const { success, error: sendError } = require('../utils/responseHelper');
const { getGoldPrice } = require('../services/goldPriceService');

exports.getGoldPrice = async (req, res) => {
    try {
        const data = await getGoldPrice();
        success(res, data, 'GOLD_PRICE_FETCHED');
    } catch (error) {
        console.error('Gold price fetch error:', error);
        sendError(res, 'GOLD_PRICE_FETCH_FAILED', 502);
    }
};
