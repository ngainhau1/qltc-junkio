const cron = require('node-cron');
const { checkBudgetAlerts } = require('./budgetAlertService');
const { captureLatestGoldPriceSnapshot, pruneOldGoldPriceSnapshots } = require('./goldPriceSnapshotService');
const { executeDueRecurringPatterns } = require('./recurringExecutionService');

const startCronJobs = () => {
    console.log('Starting recurring transaction and budget alert schedulers...');

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
            await captureLatestGoldPriceSnapshot();
        } catch (error) {
            console.error('Scheduled gold price snapshot capture failed:', error);
        }
    });

    cron.schedule('15 2 * * *', async () => {
        try {
            await pruneOldGoldPriceSnapshots();
        } catch (error) {
            console.error('Gold price snapshot prune failed:', error);
        }
    });
};

module.exports = { startCronJobs };
