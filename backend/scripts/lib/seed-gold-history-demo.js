'use strict';

const { v4: uuidv4 } = require('uuid');
const { GoldPriceSnapshot } = require('../../models');
const {
    TARGET_BRANCH,
    TARGET_PRODUCT,
    TARGET_SOURCE,
    TARGET_CURRENCY,
    TARGET_UNIT,
    fetchSjcGoldPrice,
} = require('../../services/goldPriceService');
const { SEEDED_DATA_ORIGIN } = require('../../services/goldPriceSnapshotService');

const DEMO_GOLD_HISTORY_HOURS = 168;
const DEMO_GOLD_POINT_COUNT = DEMO_GOLD_HISTORY_HOURS + 1;
const GOLD_HISTORY_RANDOM_SEED = 20260416;
const DEFAULT_GOLD_ANCHOR = {
    source: TARGET_SOURCE,
    branch: TARGET_BRANCH,
    productName: TARGET_PRODUCT,
    buy: 168500000,
    sell: 172000000,
    currency: TARGET_CURRENCY,
    unit: TARGET_UNIT,
};

const mulberry32 = (seed) => {
    let state = seed >>> 0;

    return () => {
        state += 0x6D2B79F5;
        let result = Math.imul(state ^ (state >>> 15), state | 1);
        result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
        return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
    };
};

const roundToTenThousand = (value) => Math.round(Number(value || 0) / 10000) * 10000;

const resolveGoldAnchor = async () => {
    try {
        const liveAnchor = await fetchSjcGoldPrice();

        return {
            ...DEFAULT_GOLD_ANCHOR,
            ...liveAnchor,
            updatedAt: liveAnchor.updatedAt || new Date().toISOString(),
        };
    } catch {
        console.warn('Demo gold history seed fallback: unable to reach SJC anchor, using built-in baseline.');
        return {
            ...DEFAULT_GOLD_ANCHOR,
            updatedAt: new Date().toISOString(),
        };
    }
};

const generateDemoGoldHistorySnapshots = (anchor) => {
    const random = mulberry32(GOLD_HISTORY_RANDOM_SEED);
    const anchorTime = new Date(anchor.updatedAt || new Date());
    const spread = Math.max(10000, Number(anchor.sell || 0) - Number(anchor.buy || 0));
    const reverseRows = [
        {
            capturedAt: new Date(anchorTime),
            buy: roundToTenThousand(anchor.buy),
            sell: roundToTenThousand(anchor.sell),
        },
    ];

    for (let step = 1; step <= DEMO_GOLD_HISTORY_HOURS; step += 1) {
        const nextRandom = (random() * 0.003) - 0.0015;
        const spreadRandom = (random() * 120000) - 60000;
        const latestRow = reverseRows[reverseRows.length - 1];
        const previousSell = roundToTenThousand(latestRow.sell / (1 + nextRandom));
        const previousBuy = roundToTenThousand(Math.min(previousSell - 10000, previousSell - spread + spreadRandom));

        reverseRows.push({
            capturedAt: new Date(anchorTime.getTime() - step * 60 * 60 * 1000),
            buy: previousBuy,
            sell: previousSell,
        });
    }

    return reverseRows
        .reverse()
        .map((row) => ({
            id: uuidv4(),
            source: anchor.source || TARGET_SOURCE,
            branch: anchor.branch || TARGET_BRANCH,
            productName: anchor.productName || TARGET_PRODUCT,
            buy: row.buy,
            sell: row.sell,
            currency: anchor.currency || TARGET_CURRENCY,
            unit: anchor.unit || TARGET_UNIT,
            dataOrigin: SEEDED_DATA_ORIGIN,
            capturedAt: row.capturedAt,
            createdAt: new Date(),
            updatedAt: new Date(),
        }));
};

const seedGoldHistoryDemo = async () => {
    const anchor = await resolveGoldAnchor();
    const rows = generateDemoGoldHistorySnapshots(anchor);

    await GoldPriceSnapshot.destroy({
        where: {
            source: anchor.source || TARGET_SOURCE,
            branch: anchor.branch || TARGET_BRANCH,
            productName: anchor.productName || TARGET_PRODUCT,
            dataOrigin: SEEDED_DATA_ORIGIN,
        },
    });

    await GoldPriceSnapshot.bulkCreate(rows);

    console.log(`  Gold history demo seeded: ${rows.length} hourly points.`);
    return rows.length;
};

module.exports = {
    DEFAULT_GOLD_ANCHOR,
    DEMO_GOLD_HISTORY_HOURS,
    DEMO_GOLD_POINT_COUNT,
    generateDemoGoldHistorySnapshots,
    resolveGoldAnchor,
    roundToTenThousand,
    seedGoldHistoryDemo,
};
