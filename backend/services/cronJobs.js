const cron = require('node-cron');
const { checkBudgetAlerts } = require('./budgetAlertService');
const { captureLatestGoldPriceSnapshot, pruneOldGoldPriceSnapshots } = require('./goldPriceSnapshotService');
const { executeDueRecurringPatterns } = require('./recurringExecutionService');

// GHI CHÚ HỌC TẬP - Phần lịch tự động và giá vàng SJC của Thành Đạt:
// File này đăng ký các tác vụ chạy theo lịch. Trong phần giá vàng, cron job lấy snapshot mỗi 5 phút
// và dọn snapshot cũ mỗi ngày để biểu đồ có dữ liệu mà không cần user bấm làm mới.

const startCronJobs = () => {
    console.log('Starting recurring transaction and budget alert schedulers...');

    // Khi server vừa bật, thử lưu ngay một snapshot để dashboard sớm có dữ liệu lịch sử.
    captureLatestGoldPriceSnapshot().catch((error) => {
        console.error('Initial gold price snapshot capture failed:', error);
    });

    cron.schedule('5 0 * * *', async () => {
        console.log('Checking due recurring transactions...');

        try {
            const result = await executeDueRecurringPatterns();
            console.log(`Recurring engine: processed=${result.processedCount}, skipped=${result.skippedCount}, failed=${result.failedCount}`);
        } catch (error) {
            console.error('Recurring engine failed:', error);
        }
    });

    cron.schedule('0 8 * * *', async () => {
        console.log('Checking budget alerts...');
        await checkBudgetAlerts();
    });

    cron.schedule('*/5 * * * *', async () => {
        try {
            // Mỗi 5 phút lưu một bản giá vàng mới cho biểu đồ 24H/7D.
            await captureLatestGoldPriceSnapshot();
        } catch (error) {
            console.error('Scheduled gold price snapshot capture failed:', error);
        }
    });

    cron.schedule('15 2 * * *', async () => {
        try {
            // 02:15 hằng ngày dọn dữ liệu quá cũ để bảng lịch sử không phình mãi.
            await pruneOldGoldPriceSnapshots();
        } catch (error) {
            console.error('Gold price snapshot prune failed:', error);
        }
    });
};

module.exports = { startCronJobs };
