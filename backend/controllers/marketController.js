const { success, error: sendError } = require('../utils/responseHelper');
const { getGoldPrice } = require('../services/goldPriceService');
const { getGoldPriceHistory } = require('../services/goldPriceSnapshotService');

// GHI CHÚ HỌC TẬP - Phần giá vàng SJC của Thành Đạt:
// Controller này là lớp mỏng giữa route và service. Route nhận request,
// controller gọi service, service mới xử lý cache, gọi SJC và truy vấn lịch sử.

exports.getGoldPrice = async (req, res) => {
    try {
        // getGoldPrice tự quyết định đọc Redis hay gọi nguồn SJC.
        const data = await getGoldPrice();
        success(res, data, 'GOLD_PRICE_FETCHED');
    } catch (error) {
        console.error('Gold price fetch error:', error);
        sendError(res, 'GOLD_PRICE_FETCH_FAILED', 502);
    }
};

exports.getGoldPriceHistory = async (req, res) => {
    try {
        // range hợp lệ hiện tại là 24H hoặc 7D, được kiểm tra trong service.
        const data = await getGoldPriceHistory(req.query.range);
        success(res, data, 'GOLD_PRICE_HISTORY_FETCHED');
    } catch (error) {
        if (error.message === 'GOLD_PRICE_HISTORY_RANGE_INVALID') {
            return sendError(res, 'GOLD_PRICE_HISTORY_RANGE_INVALID', 400);
        }

        console.error('Gold price history fetch error:', error);
        return sendError(res, 'GOLD_PRICE_HISTORY_FETCH_FAILED', 500);
    }
};
