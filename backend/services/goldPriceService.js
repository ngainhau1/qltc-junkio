const { client } = require('../config/redis');

// GHI CHÚ HỌC TẬP - Phần giá vàng SJC của Thành Đạt:
// Service này lấy giá vàng hiện tại từ SJC, chuẩn hóa dữ liệu về một cấu trúc ổn định,
// lưu Redis trong 60 giây và ghi thêm snapshot lịch sử nếu lấy dữ liệu mới.

const CACHE_KEY = 'market:gold:sjc:hcm:current';
const CACHE_TTL_SECONDS = 60;
const SJC_PRICE_SERVICE_URL = 'https://sjc.com.vn/GoldPrice/Services/PriceService.ashx';
const TARGET_SOURCE = 'sjc';
const TARGET_BRANCH = 'Hồ Chí Minh';
const TARGET_PRODUCT = 'Vàng SJC 1L, 10L, 1KG';
const TARGET_CURRENCY = 'VND';
const TARGET_UNIT = 'VND_PER_LUONG';

const createGoldPriceError = (code) => {
    const error = new Error(code);
    error.code = code;
    return error;
};

// SJC trả thời gian dạng "HH:mm DD/MM/YYYY"; hàm này đổi sang chuỗi ISO có múi giờ Việt Nam.
const parseSjcLatestDate = (value) => {
    if (typeof value !== 'string') {
        return null;
    }

    const match = value.trim().match(/^(\d{2}):(\d{2}) (\d{2})\/(\d{2})\/(\d{4})$/);

    if (!match) {
        return null;
    }

    const [, hours, minutes, day, month, year] = match;
    return `${year}-${month}-${day}T${hours}:${minutes}:00+07:00`;
};

// Ưu tiên đúng sản phẩm và chi nhánh cần hiển thị; nếu không có thì lấy bản ghi Vàng SJC đầu tiên.
const selectGoldRecord = (records = []) => {
    const exactMatch = records.find(
        (record) => record?.BranchName === TARGET_BRANCH && record?.TypeName === TARGET_PRODUCT
    );

    if (exactMatch) {
        return exactMatch;
    }

    return records.find((record) => typeof record?.TypeName === 'string' && record.TypeName.startsWith('Vàng SJC'));
};

// Chuẩn hóa payload từ SJC để frontend không phụ thuộc cấu trúc gốc của bên thứ ba.
const normalizeSjcResponse = (payload) => {
    if (!payload || payload.success !== true || !Array.isArray(payload.data)) {
        throw createGoldPriceError('GOLD_PRICE_PAYLOAD_INVALID');
    }

    const selectedRecord = selectGoldRecord(payload.data);

    if (!selectedRecord) {
        throw createGoldPriceError('GOLD_PRICE_RECORD_NOT_FOUND');
    }

    const updatedLabel = payload.latestDate || null;

    return {
        source: TARGET_SOURCE,
        branch: selectedRecord.BranchName || TARGET_BRANCH,
        productName: selectedRecord.TypeName || TARGET_PRODUCT,
        buy: Number(selectedRecord.BuyValue || 0),
        sell: Number(selectedRecord.SellValue || 0),
        currency: TARGET_CURRENCY,
        unit: TARGET_UNIT,
        updatedAt: parseSjcLatestDate(updatedLabel),
        updatedLabel,
    };
};

/**
 * Truy vấn dữ liệu giá vàng thực tế từ API chính thức của SJC.
 */
const fetchSjcGoldPrice = async () => {
    // API SJC dùng POST dạng form cũ, nên body cần method=GetCurrentGoldPrice.
    const response = await fetch(SJC_PRICE_SERVICE_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            Accept: 'application/json',
        },
        body: new URLSearchParams({ method: 'GetCurrentGoldPrice' }).toString(),
    });

    if (!response.ok) {
        throw createGoldPriceError('GOLD_PRICE_UPSTREAM_REQUEST_FAILED');
    }

    const rawText = await response.text();
    const payload = JSON.parse(rawText);

    return normalizeSjcResponse(payload);
};

/**
 * Lấy giá vàng hiện tại.
 * - Ưu tiên đọc dữ liệu từ Redis Cache để tối ưu hiệu năng.
 * - Nếu Cache không có hoặc hết hạn, thực hiện fetch mới từ SJC và lưu lại vào Cache.
 * - Tự động lưu bản ghi lịch sử (snapshot) vào DB.
 */
const getGoldPrice = async () => {
    try {
        const cachedValue = await client.get(CACHE_KEY);

        if (cachedValue) {
            // Có cache thì trả ngay, không gọi SJC để giảm độ trễ và giảm phụ thuộc nguồn ngoài.
            return JSON.parse(cachedValue);
        }
    } catch (error) {
        console.error('Gold price cache read error:', error);
    }

    const freshData = await fetchSjcGoldPrice();

    try {
        // setEx tự xóa cache sau CACHE_TTL_SECONDS.
        await client.setEx(CACHE_KEY, CACHE_TTL_SECONDS, JSON.stringify(freshData));
    } catch (error) {
        console.error('Gold price cache write error:', error);
    }

    try {
        // Snapshot phục vụ biểu đồ lịch sử; nếu ghi snapshot lỗi thì vẫn trả giá hiện tại cho user.
        const { upsertGoldPriceSnapshot } = require('./goldPriceSnapshotService');
        await upsertGoldPriceSnapshot(freshData);
    } catch (error) {
        console.error('Gold price snapshot write error:', error);
    }

    return freshData;
};

module.exports = {
    CACHE_KEY,
    CACHE_TTL_SECONDS,
    TARGET_BRANCH,
    TARGET_CURRENCY,
    TARGET_PRODUCT,
    TARGET_SOURCE,
    TARGET_UNIT,
    fetchSjcGoldPrice,
    getGoldPrice,
    normalizeSjcResponse,
    parseSjcLatestDate,
    selectGoldRecord,
};
