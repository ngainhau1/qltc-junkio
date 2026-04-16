const request = require('supertest');
const express = require('express');

const originalFetch = global.fetch;
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
let mockUserId = 'test-user';

jest.mock('../middleware/authMiddleware', () => (req, res, next) => {
    req.user = { id: mockUserId, role: 'USER' };
    next();
});

jest.mock('../services/goldPriceSnapshotService', () => ({
    getGoldPriceHistory: jest.fn(),
    upsertGoldPriceSnapshot: jest.fn(),
}));

const { client } = require('../config/redis');
const { getGoldPriceHistory, upsertGoldPriceSnapshot } = require('../services/goldPriceSnapshotService');
const marketRoutes = require('../routes/marketRoutes');

const app = express();
app.use(express.json());
app.use('/api/market', marketRoutes);

const buildFetchResponse = (body, overrides = {}) => ({
    ok: true,
    status: 200,
    text: jest.fn().mockResolvedValue(JSON.stringify(body)),
    ...overrides,
});

describe('Market API', () => {
    beforeAll(() => {
        global.fetch = jest.fn();
    });

    beforeEach(async () => {
        mockUserId = 'test-user';
        jest.clearAllMocks();

        const cacheKeys = await client.keys('market:gold:*');
        if (cacheKeys.length > 0) {
            await client.del(cacheKeys);
        }
    });

    afterAll(() => {
        global.fetch = originalFetch;
        consoleErrorSpy.mockRestore();
    });

    it('returns the exact Ho Chi Minh SJC gold record with normalized fields', async () => {
        upsertGoldPriceSnapshot.mockResolvedValue(null);
        global.fetch.mockResolvedValue(
            buildFetchResponse({
                success: true,
                latestDate: '13:52 16/04/2026',
                data: [
                    {
                        BranchName: 'Miền Bắc',
                        TypeName: 'Vàng SJC 1L, 10L, 1KG',
                        BuyValue: 166000000,
                        SellValue: 170000000,
                    },
                    {
                        BranchName: 'Hồ Chí Minh',
                        TypeName: 'Vàng SJC 1L, 10L, 1KG',
                        BuyValue: 168500000,
                        SellValue: 172000000,
                    },
                ],
            })
        );

        const response = await request(app).get('/api/market/gold');

        expect(response.statusCode).toBe(200);
        expect(response.body.status).toBe('success');
        expect(response.body.message).toBe('GOLD_PRICE_FETCHED');
        expect(response.body.data).toEqual({
            source: 'sjc',
            branch: 'Hồ Chí Minh',
            productName: 'Vàng SJC 1L, 10L, 1KG',
            buy: 168500000,
            sell: 172000000,
            currency: 'VND',
            unit: 'VND_PER_LUONG',
            updatedAt: '2026-04-16T13:52:00+07:00',
            updatedLabel: '13:52 16/04/2026',
        });
        expect(upsertGoldPriceSnapshot).toHaveBeenCalledTimes(1);
    });

    it('uses Redis cache on the second request within the TTL', async () => {
        upsertGoldPriceSnapshot.mockResolvedValue(null);
        global.fetch.mockResolvedValue(
            buildFetchResponse({
                success: true,
                latestDate: '13:52 16/04/2026',
                data: [
                    {
                        BranchName: 'Hồ Chí Minh',
                        TypeName: 'Vàng SJC 1L, 10L, 1KG',
                        BuyValue: 168500000,
                        SellValue: 172000000,
                    },
                ],
            })
        );

        const firstResponse = await request(app).get('/api/market/gold');
        const secondResponse = await request(app).get('/api/market/gold');

        expect(firstResponse.statusCode).toBe(200);
        expect(secondResponse.statusCode).toBe(200);
        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(upsertGoldPriceSnapshot).toHaveBeenCalledTimes(1);
    });

    it('falls back to the first generic Vàng SJC record when the exact match is missing', async () => {
        upsertGoldPriceSnapshot.mockResolvedValue(null);
        global.fetch.mockResolvedValue(
            buildFetchResponse({
                success: true,
                latestDate: '13:52 16/04/2026',
                data: [
                    {
                        BranchName: 'Miền Bắc',
                        TypeName: 'Vàng nhẫn SJC 99,99% 1 chỉ, 2 chỉ, 5 chỉ',
                        BuyValue: 168200000,
                        SellValue: 171700000,
                    },
                    {
                        BranchName: 'Miền Trung',
                        TypeName: 'Vàng SJC 5 chỉ',
                        BuyValue: 167500000,
                        SellValue: 171000000,
                    },
                ],
            })
        );

        const response = await request(app).get('/api/market/gold');

        expect(response.statusCode).toBe(200);
        expect(response.body.data.branch).toBe('Miền Trung');
        expect(response.body.data.productName).toBe('Vàng SJC 5 chỉ');
        expect(response.body.data.buy).toBe(167500000);
        expect(response.body.data.sell).toBe(171000000);
    });

    it('returns a 502 error when the upstream service responds with malformed JSON', async () => {
        global.fetch.mockResolvedValue({
            ok: true,
            status: 200,
            text: jest.fn().mockResolvedValue('not-json'),
        });

        const response = await request(app).get('/api/market/gold');

        expect(response.statusCode).toBe(502);
        expect(response.body.status).toBe('error');
        expect(response.body.message).toBe('GOLD_PRICE_FETCH_FAILED');
    });

    it('returns gold history for a valid range', async () => {
        getGoldPriceHistory.mockResolvedValue({
            range: '24H',
            source: 'sjc',
            branch: 'Hồ Chí Minh',
            productName: 'Vàng SJC 1L, 10L, 1KG',
            currency: 'VND',
            unit: 'VND_PER_LUONG',
            points: [
                {
                    capturedAt: '2026-04-16T12:00:00+07:00',
                    buy: 168500000,
                    sell: 172000000,
                },
            ],
            summary: {
                startCapturedAt: '2026-04-16T12:00:00+07:00',
                latestCapturedAt: '2026-04-16T12:00:00+07:00',
                startBuy: 168500000,
                latestBuy: 168500000,
                absoluteChangeBuy: 0,
                percentChangeBuy: 0,
                startSell: 172000000,
                latestSell: 172000000,
                absoluteChangeSell: 0,
                percentChangeSell: 0,
            },
        });

        const response = await request(app).get('/api/market/gold/history?range=24H');

        expect(response.statusCode).toBe(200);
        expect(response.body.status).toBe('success');
        expect(response.body.message).toBe('GOLD_PRICE_HISTORY_FETCHED');
        expect(getGoldPriceHistory).toHaveBeenCalledWith('24H');
    });

    it('returns 400 for an invalid history range', async () => {
        getGoldPriceHistory.mockRejectedValue(new Error('GOLD_PRICE_HISTORY_RANGE_INVALID'));

        const response = await request(app).get('/api/market/gold/history?range=INVALID');

        expect(response.statusCode).toBe(400);
        expect(response.body.status).toBe('error');
        expect(response.body.message).toBe('GOLD_PRICE_HISTORY_RANGE_INVALID');
    });

    it('returns 500 when the history service fails', async () => {
        getGoldPriceHistory.mockRejectedValue(new Error('database down'));

        const response = await request(app).get('/api/market/gold/history?range=7D');

        expect(response.statusCode).toBe(500);
        expect(response.body.status).toBe('error');
        expect(response.body.message).toBe('GOLD_PRICE_HISTORY_FETCH_FAILED');
    });
});
