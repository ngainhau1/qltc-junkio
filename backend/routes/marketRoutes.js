const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const marketController = require('../controllers/marketController');

router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Market
 *   description: Dữ liệu thị trường và các tiện ích tích hợp cho dashboard của người dùng đã đăng nhập.
 */

/**
 * @swagger
 * /api/market/gold:
 *   get:
 *     summary: Lấy giá vàng SJC mới nhất cho dashboard
 *     description: Gọi dịch vụ giá vàng SJC trực tiếp, chuẩn hóa bản ghi SJC khu vực TP. Hồ Chí Minh và lưu cache Redis trong 60 giây.
 *     tags: [Market]
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       200:
 *         description: Lấy giá vàng thành công
 *       502:
 *         description: Dịch vụ giá vàng bên ngoài không phản hồi hoặc trả lỗi
 */
router.get('/gold', marketController.getGoldPrice);

/**
 * @swagger
 * /api/market/gold/history:
 *   get:
 *     summary: Lấy lịch sử giá vàng SJC cho biểu đồ dashboard
 *     description: Trả về lịch sử giá vàng SJC đang lưu cục bộ theo khoảng thời gian đã chọn. Dữ liệu trực tiếp được ưu tiên hơn dữ liệu demo nếu trùng thời điểm.
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
 *         description: Lấy lịch sử giá vàng thành công
 *       400:
 *         description: Khoảng thời gian lịch sử không hợp lệ
 *       500:
 *         description: Không thể tải lịch sử giá vàng
 */
router.get('/gold/history', marketController.getGoldPriceHistory);

module.exports = router;
