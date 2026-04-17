const { Sequelize, DataTypes } = require('sequelize');

describe('goldPriceSnapshotService', () => {
    let mockSequelize;
    let GoldPriceSnapshot;
    let service;
    let goldPriceServiceMock;
    let consoleWarnSpy;

    beforeEach(async () => {
        jest.resetModules();
        mockSequelize = new Sequelize('sqlite::memory:', { logging: false });
        GoldPriceSnapshot = mockSequelize.define('GoldPriceSnapshot', {
            id: { type: DataTypes.STRING, defaultValue: () => `snapshot-${Math.random().toString(36).slice(2)}`, primaryKey: true },
            source: { type: DataTypes.STRING, allowNull: false },
            branch: { type: DataTypes.STRING, allowNull: false },
            productName: { type: DataTypes.STRING, allowNull: false, field: 'product_name' },
            buy: { type: DataTypes.DECIMAL, allowNull: false },
            sell: { type: DataTypes.DECIMAL, allowNull: false },
            currency: { type: DataTypes.STRING, allowNull: false },
            unit: { type: DataTypes.STRING, allowNull: false },
            dataOrigin: { type: DataTypes.STRING, allowNull: false, field: 'data_origin' },
            capturedAt: { type: DataTypes.DATE, allowNull: false, field: 'captured_at' },
        }, {
            tableName: 'gold_price_snapshots',
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
            indexes: [
                {
                    unique: true,
                    name: 'gold_price_snapshots_unique_capture_origin',
                    fields: ['source', 'branch', 'product_name', 'captured_at', 'data_origin'],
                }
            ]
        });

        await mockSequelize.sync({ force: true });

        goldPriceServiceMock = {
            TARGET_SOURCE: 'sjc',
            TARGET_BRANCH: 'Hồ Chí Minh',
            TARGET_PRODUCT: 'Vàng SJC 1L, 10L, 1KG',
            TARGET_CURRENCY: 'VND',
            TARGET_UNIT: 'VND_PER_LUONG',
            fetchSjcGoldPrice: jest.fn(),
        };

        jest.doMock('../models', () => ({
            GoldPriceSnapshot,
            sequelize: mockSequelize,
            Sequelize: require('sequelize'),
        }));
        jest.doMock('../services/goldPriceService', () => goldPriceServiceMock);

        service = require('../services/goldPriceSnapshotService');
        consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(async () => {
        if (consoleWarnSpy) {
            consoleWarnSpy.mockRestore();
        }
        await mockSequelize.close();
    });

    it('upserts live snapshots and builds ascending history summaries', async () => {
        await service.upsertGoldPriceSnapshot({
            source: 'sjc',
            branch: 'Hồ Chí Minh',
            productName: 'Vàng SJC 1L, 10L, 1KG',
            buy: 168000000,
            sell: 171700000,
            currency: 'VND',
            unit: 'VND_PER_LUONG',
            updatedAt: '2026-04-16T08:00:00+07:00',
        });
        await service.upsertGoldPriceSnapshot({
            source: 'sjc',
            branch: 'Hồ Chí Minh',
            productName: 'Vàng SJC 1L, 10L, 1KG',
            buy: 168500000,
            sell: 172000000,
            currency: 'VND',
            unit: 'VND_PER_LUONG',
            updatedAt: '2026-04-16T10:00:00+07:00',
        });

        const history = await service.getGoldPriceHistory('24H', new Date('2026-04-16T12:00:00+07:00'));

        expect(history.points).toEqual([
            {
                capturedAt: '2026-04-16T01:00:00.000Z',
                buy: 168000000,
                sell: 171700000,
            },
            {
                capturedAt: '2026-04-16T03:00:00.000Z',
                buy: 168500000,
                sell: 172000000,
            },
        ]);
        expect(history.summary).toMatchObject({
            startBuy: 168000000,
            latestBuy: 168500000,
            absoluteChangeBuy: 500000,
            startSell: 171700000,
            latestSell: 172000000,
            absoluteChangeSell: 300000,
        });
    });

    it('handles concurrent identical snapshot writes cleanly without TOCTOU race conditions', async () => {
        const livePriceData = {
            source: 'sjc',
            branch: 'Hồ Chí Minh',
            productName: 'Vàng SJC 1L, 10L, 1KG',
            buy: 168000000,
            sell: 171700000,
            currency: 'VND',
            unit: 'VND_PER_LUONG',
            updatedAt: '2026-04-16T08:00:00+07:00',
        };

        // Fire multiple upserts simultaneously to simulate race condition
        const results = await Promise.all([
            service.upsertGoldPriceSnapshot(livePriceData),
            service.upsertGoldPriceSnapshot(livePriceData),
            service.upsertGoldPriceSnapshot(livePriceData)
        ]);

        // Expect all to resolve successfully (return snapshot shapes) without throwing errors
        expect(results[0]).not.toBeNull();
        expect(results[1]).not.toBeNull();
        expect(results[2]).not.toBeNull();

        // Exactly 1 row should be persisted in the DB
        const count = (await GoldPriceSnapshot.findAll()).length;
        expect(count).toBe(1);
    });

    it('skips live snapshot persistence when updatedAt is missing', async () => {
        const result = await service.upsertGoldPriceSnapshot({
            source: 'sjc',
            branch: 'Hồ Chí Minh',
            productName: 'Vàng SJC 1L, 10L, 1KG',
            buy: 168500000,
            sell: 172000000,
            currency: 'VND',
            unit: 'VND_PER_LUONG',
            updatedAt: null,
        });

        expect(result).toBeNull();
        expect((await GoldPriceSnapshot.findAll()).length).toBe(0);
    });

    it('prefers live data over seeded data at the same timestamp', async () => {
        await GoldPriceSnapshot.bulkCreate([
            {
                source: 'sjc',
                branch: 'Hồ Chí Minh',
                productName: 'Vàng SJC 1L, 10L, 1KG',
                buy: 168100000,
                sell: 171500000,
                currency: 'VND',
                unit: 'VND_PER_LUONG',
                dataOrigin: 'seeded',
                capturedAt: new Date('2026-04-16T10:00:00+07:00'),
            },
            {
                source: 'sjc',
                branch: 'Hồ Chí Minh',
                productName: 'Vàng SJC 1L, 10L, 1KG',
                buy: 168500000,
                sell: 172000000,
                currency: 'VND',
                unit: 'VND_PER_LUONG',
                dataOrigin: 'live',
                capturedAt: new Date('2026-04-16T10:00:00+07:00'),
            },
        ]);

        const history = await service.getGoldPriceHistory('24H', new Date('2026-04-16T12:00:00+07:00'));

        expect(history.points).toHaveLength(1);
        expect(history.points[0]).toEqual({
            capturedAt: '2026-04-16T03:00:00.000Z',
            buy: 168500000,
            sell: 172000000,
        });
    });

    it('captures the latest SJC snapshot through the live fetch service', async () => {
        goldPriceServiceMock.fetchSjcGoldPrice.mockResolvedValue({
            source: 'sjc',
            branch: 'Hồ Chí Minh',
            productName: 'Vàng SJC 1L, 10L, 1KG',
            buy: 168500000,
            sell: 172000000,
            currency: 'VND',
            unit: 'VND_PER_LUONG',
            updatedAt: '2026-04-16T10:00:00+07:00',
        });

        await service.captureLatestGoldPriceSnapshot();

        expect(goldPriceServiceMock.fetchSjcGoldPrice).toHaveBeenCalledTimes(1);
        expect((await GoldPriceSnapshot.findAll()).length).toBe(1);
    });

    it('prunes snapshots older than the retention window', async () => {
        await GoldPriceSnapshot.bulkCreate([
            {
                source: 'sjc',
                branch: 'Hồ Chí Minh',
                productName: 'Vàng SJC 1L, 10L, 1KG',
                buy: 168100000,
                sell: 171600000,
                currency: 'VND',
                unit: 'VND_PER_LUONG',
                dataOrigin: 'seeded',
                capturedAt: new Date('2025-01-01T10:00:00+07:00'),
            },
            {
                source: 'sjc',
                branch: 'Hồ Chí Minh',
                productName: 'Vàng SJC 1L, 10L, 1KG',
                buy: 168500000,
                sell: 172000000,
                currency: 'VND',
                unit: 'VND_PER_LUONG',
                dataOrigin: 'live',
                capturedAt: new Date('2026-04-10T10:00:00+07:00'),
            },
        ]);

        const deletedCount = await service.pruneOldGoldPriceSnapshots(new Date('2026-04-16T10:00:00+07:00'));

        expect(deletedCount).toBe(1);
        expect((await GoldPriceSnapshot.findAll()).length).toBe(1);
    });
});
