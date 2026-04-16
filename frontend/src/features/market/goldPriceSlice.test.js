import { beforeEach, describe, expect, it, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import api from '@/lib/api';
import reducer, { fetchGoldPrice } from './goldPriceSlice';

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

describe('goldPriceSlice', () => {
    beforeEach(() => {
        api.get.mockReset();
    });

    it('stores gold price data after a successful fetch', async () => {
        api.get.mockResolvedValue({ data: successPayload });

        const store = configureStore({
            reducer: {
                goldPrice: reducer,
            },
        });

        await store.dispatch(fetchGoldPrice());

        expect(store.getState().goldPrice).toMatchObject({
            data: successPayload,
            loading: false,
            error: null,
        });
        expect(store.getState().goldPrice.lastFetchedAt).toEqual(expect.any(Number));
    });

    it('stores an error and clears data when the fetch fails', async () => {
        api.get.mockRejectedValue({
            response: {
                data: {
                    message: 'GOLD_PRICE_FETCH_FAILED',
                },
            },
        });

        const store = configureStore({
            reducer: {
                goldPrice: reducer,
            },
            preloadedState: {
                goldPrice: {
                    data: successPayload,
                    loading: false,
                    error: null,
                    lastFetchedAt: 123,
                },
            },
        });

        await store.dispatch(fetchGoldPrice());

        expect(store.getState().goldPrice).toMatchObject({
            data: null,
            loading: false,
            error: 'GOLD_PRICE_FETCH_FAILED',
            lastFetchedAt: 123,
        });
    });
});
