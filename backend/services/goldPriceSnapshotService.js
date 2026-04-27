const { Op } = require('sequelize');
const { GoldPriceSnapshot } = require('../models');
const {
    TARGET_BRANCH,
    TARGET_PRODUCT,
    TARGET_SOURCE,
    TARGET_CURRENCY,
    TARGET_UNIT,
    fetchSjcGoldPrice,
} = require('./goldPriceService');

// GHI CHÚ HỌC TẬP - Phần giá vàng SJC của Thành Đạt:
// Service này quản lý lịch sử giá vàng. Nó lưu snapshot, lấy dữ liệu theo khoảng 24H/7D,
// tính tăng giảm và xóa dữ liệu quá cũ để bảng không tăng mãi.

const GOLD_HISTORY_RANGES = Object.freeze({
    '24H': 24 * 60 * 60 * 1000,
    '7D': 7 * 24 * 60 * 60 * 1000,
});
const SNAPSHOT_RETENTION_DAYS = 90;
const LIVE_DATA_ORIGIN = 'live';
const SEEDED_DATA_ORIGIN = 'seeded';

const normalizeSnapshotRow = (row) => ({
    capturedAt: row.capturedAt instanceof Date ? row.capturedAt.toISOString() : new Date(row.capturedAt).toISOString(),
    buy: Number(row.buy || 0),
    sell: Number(row.sell || 0),
    dataOrigin: row.dataOrigin || LIVE_DATA_ORIGIN,
});

// Tính mức tăng/giảm giữa điểm đầu và điểm mới nhất để frontend hiện trend.
const buildSummary = (points) => {
    if (!Array.isArray(points) || points.length === 0) {
        return null;
    }

    const startPoint = points[0];
    const latestPoint = points[points.length - 1];
    const absoluteChangeBuy = latestPoint.buy - startPoint.buy;
    const absoluteChangeSell = latestPoint.sell - startPoint.sell;

    return {
        startCapturedAt: startPoint.capturedAt,
        latestCapturedAt: latestPoint.capturedAt,
        startBuy: startPoint.buy,
        latestBuy: latestPoint.buy,
        absoluteChangeBuy,
        percentChangeBuy: startPoint.buy === 0 ? 0 : Number(((absoluteChangeBuy / startPoint.buy) * 100).toFixed(2)),
        startSell: startPoint.sell,
        latestSell: latestPoint.sell,
        absoluteChangeSell,
        percentChangeSell: startPoint.sell === 0 ? 0 : Number(((absoluteChangeSell / startPoint.sell) * 100).toFixed(2)),
    };
};

// Nếu cùng thời điểm có cả dữ liệu seed và dữ liệu live, ưu tiên dữ liệu live.
const dedupeHistoryRows = (rows) => {
    const dedupedRows = new Map();

    for (const row of rows) {
        const normalized = normalizeSnapshotRow(row);
        const existing = dedupedRows.get(normalized.capturedAt);

        if (!existing || normalized.dataOrigin === LIVE_DATA_ORIGIN) {
            dedupedRows.set(normalized.capturedAt, normalized);
        }
    }

    return [...dedupedRows.values()]
        .sort((left, right) => new Date(left.capturedAt) - new Date(right.capturedAt))
        .map(({ capturedAt, buy, sell }) => ({ capturedAt, buy, sell }));
};

// Lưu hoặc cập nhật snapshot theo source/branch/product/time để tránh trùng bản ghi.
const upsertGoldPriceSnapshot = async (livePrice) => {
    if (!livePrice?.updatedAt) {
        console.warn('Skipping gold price snapshot because updatedAt is unavailable.');
        return null;
    }

    const snapshotData = {
        source: livePrice.source || TARGET_SOURCE,
        branch: livePrice.branch || TARGET_BRANCH,
        productName: livePrice.productName || TARGET_PRODUCT,
        buy: Number(livePrice.buy || 0),
        sell: Number(livePrice.sell || 0),
        currency: livePrice.currency || TARGET_CURRENCY,
        unit: livePrice.unit || TARGET_UNIT,
        dataOrigin: LIVE_DATA_ORIGIN,
        capturedAt: new Date(livePrice.updatedAt),
    };

    let snapshot = await GoldPriceSnapshot.findOne({
        where: {
            source: snapshotData.source,
            branch: snapshotData.branch,
            productName: snapshotData.productName,
            capturedAt: snapshotData.capturedAt,
            dataOrigin: snapshotData.dataOrigin,
        }
    });

    if (snapshot) {
        snapshot = await snapshot.update(snapshotData);
    } else {
        try {
            snapshot = await GoldPriceSnapshot.create(snapshotData);
        } catch (error) {
            if (error.name === 'SequelizeUniqueConstraintError') {
                snapshot = await GoldPriceSnapshot.findOne({
                    where: {
                        source: snapshotData.source,
                        branch: snapshotData.branch,
                        productName: snapshotData.productName,
                        capturedAt: snapshotData.capturedAt,
                        dataOrigin: snapshotData.dataOrigin,
                    }
                });
                if (!snapshot) {
                    throw error;
                }

                snapshot = await snapshot.update(snapshotData);
            } else {
                throw error;
            }
        }
    }

    return snapshot;
};

const captureLatestGoldPriceSnapshot = async () => {
    // Cron job dùng hàm này để chủ động lưu lịch sử, không cần người dùng mở dashboard.
    const livePrice = await fetchSjcGoldPrice();
    await upsertGoldPriceSnapshot(livePrice);
    return livePrice;
};

const getGoldPriceHistory = async (range, referenceTime = new Date()) => {
    const rangeDuration = GOLD_HISTORY_RANGES[range];

    if (!rangeDuration) {
        // Chỉ nhận các khoảng được frontend hỗ trợ để tránh query tùy ý.
        throw new Error('GOLD_PRICE_HISTORY_RANGE_INVALID');
    }

    const endTime = new Date(referenceTime);
    const startTime = new Date(endTime.getTime() - rangeDuration);
    const rows = await GoldPriceSnapshot.findAll({
        where: {
            source: TARGET_SOURCE,
            branch: TARGET_BRANCH,
            productName: TARGET_PRODUCT,
            capturedAt: {
                [Op.gte]: startTime,
                [Op.lte]: endTime,
            },
        },
    });
    const points = dedupeHistoryRows(rows);

    return {
        range,
        source: TARGET_SOURCE,
        branch: TARGET_BRANCH,
        productName: TARGET_PRODUCT,
        currency: TARGET_CURRENCY,
        unit: TARGET_UNIT,
        points,
        summary: buildSummary(points),
    };
};

const pruneOldGoldPriceSnapshots = async (referenceTime = new Date()) => {
    // Dọn dữ liệu cũ hơn SNAPSHOT_RETENTION_DAYS để giảm dung lượng DB.
    const cutoff = new Date(referenceTime.getTime() - SNAPSHOT_RETENTION_DAYS * 24 * 60 * 60 * 1000);

    return GoldPriceSnapshot.destroy({
        where: {
            capturedAt: {
                [Op.lt]: cutoff,
            },
        },
    });
};

module.exports = {
    GOLD_HISTORY_RANGES,
    LIVE_DATA_ORIGIN,
    SEEDED_DATA_ORIGIN,
    SNAPSHOT_RETENTION_DAYS,
    buildSummary,
    captureLatestGoldPriceSnapshot,
    dedupeHistoryRows,
    getGoldPriceHistory,
    pruneOldGoldPriceSnapshots,
    upsertGoldPriceSnapshot,
};
