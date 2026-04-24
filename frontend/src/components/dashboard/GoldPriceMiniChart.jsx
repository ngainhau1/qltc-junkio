import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { formatDateString } from '@/lib/utils';

// GHI CHÚ HỌC TẬP - Phần giá vàng SJC của Thành Đạt:
// Component này chỉ vẽ biểu đồ nhỏ cho GoldPriceCard. Nó không tự gọi API,
// mà nhận points/range/color từ component cha để giữ trách nhiệm rõ ràng.

const buildAxisLabel = (capturedAt, range) => {
    // Trục X đổi cách hiển thị theo range: 7D hiển thị ngày, 24H hiển thị giờ.
    if (range === '7D') {
        return formatDateString(capturedAt, { day: '2-digit', month: '2-digit' });
    }

    return formatDateString(capturedAt, { hour: '2-digit', minute: '2-digit' });
};

const buildTooltipLabel = (capturedAt) =>
    formatDateString(capturedAt, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

const tooltipFormatter = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
});

const ChartTooltip = ({ active, payload }) => {
    const { t } = useTranslation();

    if (!active || !payload?.length) {
        return null;
    }

    const point = payload[0]?.payload;

    return (
        <div className="rounded-lg border border-border bg-background/95 p-3 shadow-lg backdrop-blur-sm">
            <p className="text-xs font-medium text-muted-foreground">{buildTooltipLabel(point.capturedAt)}</p>
            <p className="mt-1 text-sm font-semibold text-foreground">
                {t('marketGold.chartSellLabel')}: {tooltipFormatter.format(Number(point.sell || 0))}
            </p>
        </div>
    );
};

export function GoldPriceMiniChart({ points, range, color }) {
    // Recharts cần trường label riêng để hiển thị trục X gọn hơn.
    const chartData = points.map((point) => ({
        ...point,
        label: buildAxisLabel(point.capturedAt, range),
    }));

    return (
        <div className="h-[180px] w-full" data-testid="gold-mini-chart">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 12, right: 8, bottom: 0, left: 0 }}>
                    <defs>
                        <linearGradient id={`goldTrend-${range}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.35} />
                            <stop offset="95%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                    <XAxis
                        axisLine={false}
                        dataKey="label"
                        minTickGap={24}
                        tick={{ fill: '#7c6f64', fontSize: 12 }}
                        tickLine={false}
                    />
                    <YAxis hide width={0} />
                    <Tooltip content={<ChartTooltip />} cursor={{ stroke: color, strokeOpacity: 0.35 }} />
                    <Area
                        dataKey="sell"
                        fill={`url(#goldTrend-${range})`}
                        fillOpacity={1}
                        isAnimationActive={false}
                        name="sell"
                        stroke={color}
                        strokeWidth={3}
                        type="monotone"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
