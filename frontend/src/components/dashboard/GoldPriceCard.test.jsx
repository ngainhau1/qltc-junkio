// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import api from '@/lib/api';
import goldPriceReducer from '@/features/market/goldPriceSlice';
import { GoldPriceCard } from './GoldPriceCard';

vi.mock('@/lib/api', () => ({
    default: {
        get: vi.fn(),
    },
}));

vi.mock('./GoldPriceMiniChart', () => ({
    GoldPriceMiniChart: ({ range, points }) => (
        <div data-testid="gold-mini-chart">{`chart-${range}-${points.length}`}</div>
    ),
}));

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key, params = {}) => {
            const translations = {
                'common.unknown': 'Không xác định',
                'marketGold.title': 'Giá vàng live',
                'marketGold.description': 'Giá vàng SJC được lấy trực tiếp từ nguồn công khai.',
                'marketGold.loading': 'Đang tải giá vàng...',
                'marketGold.unavailable': 'Không thể tải giá vàng lúc này.',
                'marketGold.unavailableDesc': 'Dữ liệu từ SJC đang tạm thời không phản hồi. Widget sẽ tự thử lại sau.',
                'marketGold.refreshing': 'Đang cập nhật',
                'marketGold.autoRefresh': 'Tự làm mới mỗi 60 giây',
                'marketGold.product': 'Sản phẩm',
                'marketGold.buy': 'Giá mua',
                'marketGold.sell': 'Giá bán',
                'marketGold.unitValue': 'Đơn vị: VNĐ / lượng',
                'marketGold.range24h': '24 giờ',
                'marketGold.range7d': '7 ngày',
                'marketGold.trendLabel': 'Xu hướng giá bán',
                'marketGold.vsRangeStart': 'so với đầu kỳ',
                'marketGold.historyUnavailable': 'Chưa thể tải lịch sử giá vàng.',
                'marketGold.historyUnavailableDesc': 'API live vẫn đang hoạt động, nhưng dữ liệu lịch sử tạm thời chưa sẵn sàng.',
                'marketGold.historyAccumulating': 'Đang tích lũy lịch sử giá vàng.',
                'marketGold.historyAccumulatingDesc': 'Cần thêm dữ liệu snapshot trước khi có thể vẽ biểu đồ.',
            };

            if (key === 'marketGold.sourceLabel') {
                return `Nguồn: ${params.value}`;
            }

            if (key === 'marketGold.branchLabel') {
                return `Chi nhánh: ${params.value}`;
            }

            if (key === 'marketGold.updatedLabel') {
                return `Cập nhật: ${params.value}`;
            }

            return translations[key] || key;
        },
    }),
    initReactI18next: { type: '3rdParty', init: vi.fn() },
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
    points: [
        ...history24hPayload.points,
        {
            capturedAt: '2026-04-10T10:00:00+07:00',
            buy: 167900000,
            sell: 171300000,
        },
    ],
};

const singlePointHistoryPayload = {
    ...history24hPayload,
    points: [history24hPayload.points[0]],
    summary: {
        startCapturedAt: '2026-04-16T09:00:00+07:00',
        latestCapturedAt: '2026-04-16T09:00:00+07:00',
        startBuy: 168100000,
        latestBuy: 168100000,
        absoluteChangeBuy: 0,
        percentChangeBuy: 0,
        startSell: 171700000,
        latestSell: 171700000,
        absoluteChangeSell: 0,
        percentChangeSell: 0,
    },
};

const renderWithStore = () => {
    const store = configureStore({
        reducer: {
            goldPrice: goldPriceReducer,
        },
    });

    return render(
        <Provider store={store}>
            <GoldPriceCard />
        </Provider>
    );
};

describe('GoldPriceCard', () => {
    beforeEach(() => {
        api.get.mockReset();
        cleanup();
    });

    it('shows a loading state while the first current-price request is still pending', async () => {
        api.get.mockImplementation(() => new Promise(() => {}));

        renderWithStore();

        expect(await screen.findByText('Đang tải giá vàng...')).toBeTruthy();
    });

    it('renders the live gold price payload and the default 24H chart after successful fetches', async () => {
        api.get.mockImplementation((url) => {
            if (url === '/market/gold') {
                return Promise.resolve({ data: successPayload });
            }

            if (url === '/market/gold/history?range=24H') {
                return Promise.resolve({ data: history24hPayload });
            }

            return Promise.reject(new Error(`Unexpected URL: ${url}`));
        });

        renderWithStore();

        expect(await screen.findByText('Vàng SJC 1L, 10L, 1KG')).toBeTruthy();
        expect(screen.getByText('Chi nhánh: Hồ Chí Minh')).toBeTruthy();
        expect(screen.getByTestId('gold-mini-chart').textContent).toBe('chart-24H-2');
    });

    it('keeps the current live price visible when history fails', async () => {
        api.get.mockImplementation((url) => {
            if (url === '/market/gold') {
                return Promise.resolve({ data: successPayload });
            }

            if (url === '/market/gold/history?range=24H') {
                return Promise.reject({
                    response: {
                        data: {
                            message: 'GOLD_PRICE_HISTORY_FETCH_FAILED',
                        },
                    },
                });
            }

            return Promise.reject(new Error(`Unexpected URL: ${url}`));
        });

        renderWithStore();

        expect(await screen.findByText('Vàng SJC 1L, 10L, 1KG')).toBeTruthy();
        expect(screen.getByTestId('gold-history-unavailable')).toBeTruthy();
    });

    it('renders the accumulation state when history has fewer than two points', async () => {
        api.get.mockImplementation((url) => {
            if (url === '/market/gold') {
                return Promise.resolve({ data: successPayload });
            }

            if (url === '/market/gold/history?range=24H') {
                return Promise.resolve({ data: singlePointHistoryPayload });
            }

            return Promise.reject(new Error(`Unexpected URL: ${url}`));
        });

        renderWithStore();

        expect(await screen.findByText('Đang tích lũy lịch sử giá vàng.')).toBeTruthy();
        expect(screen.getByTestId('gold-history-accumulating')).toBeTruthy();
    });

    it('switches range from 24H to 7D and requests the new history series', async () => {
        api.get.mockImplementation((url) => {
            if (url === '/market/gold') {
                return Promise.resolve({ data: successPayload });
            }

            if (url === '/market/gold/history?range=24H') {
                return Promise.resolve({ data: history24hPayload });
            }

            if (url === '/market/gold/history?range=7D') {
                return Promise.resolve({ data: history7dPayload });
            }

            return Promise.reject(new Error(`Unexpected URL: ${url}`));
        });

        renderWithStore();

        await screen.findByTestId('gold-mini-chart');
        fireEvent.click(screen.getAllByRole('button', { name: '7 ngày' }).at(-1));

        await waitFor(() => {
            expect(api.get).toHaveBeenCalledWith('/market/gold/history?range=7D');
        });
        expect(screen.getByTestId('gold-mini-chart').textContent).toBe('chart-7D-3');
    });

    it('cleans up both current and history polling intervals on unmount', async () => {
        api.get.mockImplementation((url) => {
            if (url === '/market/gold') {
                return Promise.resolve({ data: successPayload });
            }

            if (url === '/market/gold/history?range=24H') {
                return Promise.resolve({ data: history24hPayload });
            }

            return Promise.reject(new Error(`Unexpected URL: ${url}`));
        });

        const setIntervalSpy = vi.spyOn(window, 'setInterval')
            .mockReturnValueOnce(1111)
            .mockReturnValueOnce(2222);
        const clearIntervalSpy = vi.spyOn(window, 'clearInterval').mockImplementation(() => {});

        const { unmount } = renderWithStore();

        await waitFor(() => {
            expect(api.get).toHaveBeenCalledWith('/market/gold');
            expect(api.get).toHaveBeenCalledWith('/market/gold/history?range=24H');
        });

        unmount();

        expect(clearIntervalSpy).toHaveBeenCalledWith(1111);
        expect(clearIntervalSpy).toHaveBeenCalledWith(2222);

        setIntervalSpy.mockRestore();
        clearIntervalSpy.mockRestore();
    });
});
