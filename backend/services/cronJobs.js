const cron = require('node-cron');
const { checkBudgetAlerts } = require('./budgetAlertService');
const { executeDueRecurringPatterns } = require('./recurringExecutionService');

const startCronJobs = () => {
    console.log('Starting recurring transaction and budget alert schedulers...');

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
};

module.exports = { startCronJobs };
