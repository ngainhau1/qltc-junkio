const { Sequelize, DataTypes } = require('sequelize');

describe('seedGoldHistoryDemo helper', () => {
    let mockSequelize;
    let GoldPriceSnapshot;
    let helper;
    let goldPriceServiceMock;

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
        jest.doMock('../services/goldPriceSnapshotService', () => ({
            SEEDED_DATA_ORIGIN: 'seeded',
        }));

        helper = require('../scripts/lib/seed-gold-history-demo');
    });

    afterEach(async () => {
        await mockSequelize.close();
    });

    it('creates 169 seeded points and refreshes them idempotently', async () => {
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

        await helper.seedGoldHistoryDemo();
        await helper.seedGoldHistoryDemo();

        const rows = (await GoldPriceSnapshot.findAll()).sort(
            (left, right) => new Date(left.capturedAt) - new Date(right.capturedAt)
        );

        expect(rows).toHaveLength(169);
        expect(rows[0].dataOrigin).toBe('seeded');
        expect(rows[168].capturedAt.toISOString()).toBe('2026-04-16T03:00:00.000Z');
    });

    it('falls back to the built-in baseline when SJC is unavailable', async () => {
        goldPriceServiceMock.fetchSjcGoldPrice.mockRejectedValue(new Error('offline'));

        const anchor = await helper.resolveGoldAnchor();

        expect(anchor).toMatchObject({
            buy: 168500000,
            sell: 172000000,
            currency: 'VND',
            unit: 'VND_PER_LUONG',
        });
        expect(anchor.updatedAt).toBeTruthy();
    });
});
