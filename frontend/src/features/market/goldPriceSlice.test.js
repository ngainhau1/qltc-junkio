import { beforeEach, describe, expect, it, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import api from '@/lib/api';
import reducer, {
    fetchGoldPrice,
    fetchGoldPriceHistory,
    setGoldHistoryRange,
} from './goldPriceSlice';

vi.mock('@/lib/api', () => ({
    default: {
        get: vi.fn(),
    },
}));

const successPayload = {
    source: 'sjc',
    branch: 'Hồ Chí Minh',
    productName: 'Vàng SJC 1L, 10L, 1KG',
    buy: 168500000,
    sell: 172000000,
    currency: 'VND',
    unit: 'VND_PER_LUONG',
    updatedAt: '2026-04-16T13:52:00+07:00',
    updatedLabel: '13:52 16/04/2026',
};

const history24hPayload = {
    range: '24H',
    source: 'sjc',
    branch: 'Hồ Chí Minh',
    productName: 'Vàng SJC 1L, 10L, 1KG',
    currency: 'VND',
    unit: 'VND_PER_LUONG',
    points: [
        {
            capturedAt: '2026-04-16T09:00:00+07:00',
            buy: 168100000,
            sell: 171700000,
        },
        {
            capturedAt: '2026-04-16T10:00:00+07:00',
            buy: 168500000,
            sell: 172000000,
        },
    ],
    summary: {
        startCapturedAt: '2026-04-16T09:00:00+07:00',
        latestCapturedAt: '2026-04-16T10:00:00+07:00',
        startBuy: 168100000,
        latestBuy: 168500000,
        absoluteChangeBuy: 400000,
        percentChangeBuy: 0.24,
        startSell: 171700000,
        latestSell: 172000000,
        absoluteChangeSell: 300000,
        percentChangeSell: 0.17,
    },
};

const history7dPayload = {
    ...history24hPayload,
    range: '7D',
};

const createStore = () =>
    configureStore({
        reducer: {
            goldPrice: reducer,
        },
    });

describe('goldPriceSlice', () => {
    beforeEach(() => {
        api.get.mockReset();
    });

    it('stores gold price data after a successful fetch', async () => {
        api.get.mockResolvedValue({ data: successPayload });
        const store = createStore();

        await store.dispatch(fetchGoldPrice());

        const state = store.getState().goldPrice;
        expect(state.data).toEqual(successPayload);
        expect(state.loading).toBe(false);
        expect(state.error).toBeNull();
        expect(state.lastFetchedAt).toBeTypeOf('number');
    });

    it('stores history data by range after a successful fetch', async () => {
        api.get.mockResolvedValue({ data: history24hPayload });
        const store = createStore();

        await store.dispatch(fetchGoldPriceHistory({ range: '24H' }));

        const state = store.getState().goldPrice.historyByRange['24H'];
        expect(state.data).toEqual(history24hPayload);
        expect(state.loading).toBe(false);
        expect(state.error).toBeNull();
        expect(state.lastFetchedAt).toBeTypeOf('number');
    });

    it('stores history errors by range after a failed request', async () => {
        api.get.mockRejectedValue({
            response: {
                data: {
                    message: 'GOLD_PRICE_HISTORY_FETCH_FAILED',
                },
            },
        });
        const store = createStore();

        await store.dispatch(fetchGoldPriceHistory({ range: '7D' }));

        const state = store.getState().goldPrice.historyByRange['7D'];
        expect(state.data).toBeNull();
        expect(state.loading).toBe(false);
        expect(state.error).toBe('GOLD_PRICE_HISTORY_FETCH_FAILED');
    });

    it('skips refetching a warm history range when cache is still fresh', async () => {
        api.get.mockResolvedValue({ data: history24hPayload });
        const store = createStore();

        await store.dispatch(fetchGoldPriceHistory({ range: '24H' }));
        await store.dispatch(fetchGoldPriceHistory({ range: '24H' }));

        expect(api.get).toHaveBeenCalledTimes(1);
    });

    it('updates the selected range without affecting current price data', async () => {
        api.get
            .mockResolvedValueOnce({ data: successPayload })
            .mockResolvedValueOnce({ data: history24hPayload })
            .mockResolvedValueOnce({ data: history7dPayload });
        const store = createStore();

        await store.dispatch(fetchGoldPrice());
        await store.dispatch(fetchGoldPriceHistory({ range: '24H' }));
        store.dispatch(setGoldHistoryRange('7D'));
        await store.dispatch(fetchGoldPriceHistory({ range: '7D' }));

        const state = store.getState().goldPrice;
        expect(state.selectedRange).toBe('7D');
        expect(state.data).toEqual(successPayload);
        expect(state.historyByRange['7D'].data).toEqual(history7dPayload);
    });
});
