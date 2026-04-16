// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '@/lib/api';
import goldPriceReducer from '@/features/market/goldPriceSlice';
import { GoldPriceCard } from './GoldPriceCard';

vi.mock('@/lib/api', () => ({
    default: {
        get: vi.fn(),
    },
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
                'marketGold.unitValue': 'Đơn vị: VND / lượng',
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
    });

    it('shows a loading state while the first request is still pending', async () => {
        api.get.mockImplementation(() => new Promise(() => {}));

        renderWithStore();

        expect(await screen.findByText('Đang tải giá vàng...')).toBeTruthy();
    });

    it('renders the live gold price payload after a successful fetch', async () => {
        api.get.mockResolvedValue({ data: successPayload });

        renderWithStore();

        expect(await screen.findByText('Vàng SJC 1L, 10L, 1KG')).toBeTruthy();
        expect(screen.getByText('Chi nhánh: Hồ Chí Minh')).toBeTruthy();
        expect(screen.getByText(/168\.500\.000/)).toBeTruthy();
        expect(screen.getByText(/172\.000\.000/)).toBeTruthy();
    });

    it('renders the unavailable state when the request fails', async () => {
        api.get.mockRejectedValue({
            response: {
                data: {
                    message: 'GOLD_PRICE_FETCH_FAILED',
                },
            },
        });

        renderWithStore();

        expect(await screen.findByText('Không thể tải giá vàng lúc này.')).toBeTruthy();
    });

    it('cleans up the polling interval on unmount', async () => {
        api.get.mockResolvedValue({ data: successPayload });
        const setIntervalSpy = vi.spyOn(window, 'setInterval').mockReturnValue(1234);
        const clearIntervalSpy = vi.spyOn(window, 'clearInterval').mockImplementation(() => {});

        const { unmount } = renderWithStore();

        await waitFor(() => {
            expect(api.get).toHaveBeenCalledTimes(1);
        });

        unmount();

        expect(clearIntervalSpy).toHaveBeenCalledWith(1234);

        setIntervalSpy.mockRestore();
        clearIntervalSpy.mockRestore();
    });
});
