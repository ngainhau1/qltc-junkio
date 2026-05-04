const { client } = require('../config/redis');
// Service này lấy giá vàng hiện tại từ SJC, chuẩn hóa dữ liệu về một cấu trúc ổn định,
// lưu Redis trong 60 giây và ghi thêm snapshot lịch sử nếu lấy dữ liệu mới.

const CACHE_KEY = 'market:gold:sjc:hcm:current';
const CACHE_TTL_SECONDS = 60;
const SNAPSHOT_FALLBACK_CACHE_TTL_SECONDS = 5 * 60;
const SJC_PRICE_SERVICE_URL = 'https://sjc.com.vn/GoldPrice/Services/PriceService.ashx';
const SJC_REQUEST_HEADERS = Object.freeze({
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    Accept: 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0 Safari/537.36',
    Origin: 'https://sjc.com.vn',
    Referer: 'https://sjc.com.vn/',
    'X-Requested-With': 'XMLHttpRequest',
});
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
//nếu false thì trả về null, nếu true thì trả về chuỗi định dạng "HH:mm DD/MM/YYYY" theo múi giờ Việt Nam.
const formatSnapshotUpdatedLabel = (value) => {
    const date = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    const parts = new Intl.DateTimeFormat('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour12: false,
    }).formatToParts(date);
    const getPart = (type) => parts.find((part) => part.type === type)?.value;

    return `${getPart('hour')}:${getPart('minute')} ${getPart('day')}/${getPart('month')}/${getPart('year')}`;
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

const fetchSjcGoldPrice = async () => {
    // API SJC dùng POST dạng form cũ, nên body cần method=GetCurrentGoldPrice.
    const response = await fetch(SJC_PRICE_SERVICE_URL, {
        method: 'POST',
        headers: SJC_REQUEST_HEADERS,
        body: new URLSearchParams({ method: 'GetCurrentGoldPrice' }).toString(),
    });

    if (!response.ok) {
        throw createGoldPriceError('GOLD_PRICE_UPSTREAM_REQUEST_FAILED');
    }

    const rawText = await response.text();
    const payload = JSON.parse(rawText);

    return normalizeSjcResponse(payload);
};

const getLatestSnapshotFallback = async () => {
    const { GoldPriceSnapshot } = require('../models');
    let snapshot = await GoldPriceSnapshot.findOne({
        where: {
            source: TARGET_SOURCE,
            branch: TARGET_BRANCH,
            productName: TARGET_PRODUCT,
        },
        order: [['capturedAt', 'DESC']],
    });

    if (!snapshot) {
        snapshot = await GoldPriceSnapshot.findOne({
            where: { source: TARGET_SOURCE },
            order: [['capturedAt', 'DESC']],
        });
    }

    if (!snapshot) {
        throw createGoldPriceError('GOLD_PRICE_SNAPSHOT_FALLBACK_NOT_FOUND');
    }

    const capturedAt = snapshot.capturedAt instanceof Date
        ? snapshot.capturedAt
        : new Date(snapshot.capturedAt);

    return {
        source: TARGET_SOURCE,
        branch: snapshot.branch || TARGET_BRANCH,
        productName: snapshot.productName || TARGET_PRODUCT,
        buy: Number(snapshot.buy || 0),
        sell: Number(snapshot.sell || 0),
        currency: snapshot.currency || TARGET_CURRENCY,
        unit: snapshot.unit || TARGET_UNIT,
        updatedAt: Number.isNaN(capturedAt.getTime()) ? null : capturedAt.toISOString(),
        updatedLabel: formatSnapshotUpdatedLabel(capturedAt),
        dataOrigin: snapshot.dataOrigin || 'snapshot',
        isFallback: true,
    };
};

const cacheGoldPrice = async (data, ttlSeconds = CACHE_TTL_SECONDS) => {
    try {
        await client.setEx(CACHE_KEY, ttlSeconds, JSON.stringify(data));
    } catch (error) {
        console.error('Gold price cache write error:', error);
    }
};

const getGoldPriceLiveOnly = async () => {
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
// Hàm chính để gọi từ controller; ưu tiên lấy giá live, nếu lỗi thì fallback về snapshot gần nhất.
const getGoldPrice = async () => {
    try {
        return await getGoldPriceLiveOnly();
    } catch (error) {
        console.error('Gold price live fetch error, falling back to latest snapshot:', error);

        const fallbackData = await getLatestSnapshotFallback();
        await cacheGoldPrice(fallbackData, SNAPSHOT_FALLBACK_CACHE_TTL_SECONDS);

        return fallbackData;
    }
};

module.exports = {
    CACHE_KEY,
    CACHE_TTL_SECONDS,
    SNAPSHOT_FALLBACK_CACHE_TTL_SECONDS,
    SJC_REQUEST_HEADERS,
    TARGET_BRANCH,
    TARGET_CURRENCY,
    TARGET_PRODUCT,
    TARGET_SOURCE,
    TARGET_UNIT,
    fetchSjcGoldPrice,
    getLatestSnapshotFallback,
    getGoldPrice,
    getGoldPriceLiveOnly,
    normalizeSjcResponse,
    parseSjcLatestDate,
    selectGoldRecord,
};
