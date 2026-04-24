jest.mock('node-cron', () => {
    const jobs = [];
    const schedule = jest.fn((expression, handler) => {
        jobs.push({ expression, handler });
        return { stop: jest.fn() };
    });

    return { schedule, __jobs: jobs };
});

jest.mock('../services/recurringExecutionService', () => ({
    executeDueRecurringPatterns: jest.fn().mockResolvedValue({
        processedCount: 1,
        skippedCount: 0,
        failedCount: 0
    })
}));

jest.mock('../services/budgetAlertService', () => ({
    checkBudgetAlerts: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('../services/goldPriceSnapshotService', () => ({
    captureLatestGoldPriceSnapshot: jest.fn().mockResolvedValue(undefined),
    pruneOldGoldPriceSnapshots: jest.fn().mockResolvedValue(0),
}));

const cron = require('node-cron');
const { executeDueRecurringPatterns } = require('../services/recurringExecutionService');
const { checkBudgetAlerts } = require('../services/budgetAlertService');
const { captureLatestGoldPriceSnapshot, pruneOldGoldPriceSnapshots } = require('../services/goldPriceSnapshotService');
const { startCronJobs } = require('../services/cronJobs');

describe('cronJobs', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        cron.__jobs.length = 0;
    });

    it('registers recurring, budget, and gold market jobs with the expected schedules', () => {
        startCronJobs();

        expect(captureLatestGoldPriceSnapshot).toHaveBeenCalledTimes(1);
        expect(cron.schedule).toHaveBeenCalledTimes(4);
        expect(cron.__jobs.map((job) => job.expression)).toEqual(['5 0 * * *', '0 8 * * *', '*/5 * * * *', '15 2 * * *']);
    });

    it('runs the shared recurring, budget, and gold history jobs', async () => {
        startCronJobs();

        await cron.__jobs[0].handler();
        await cron.__jobs[1].handler();
        await cron.__jobs[2].handler();
        await cron.__jobs[3].handler();

        expect(executeDueRecurringPatterns).toHaveBeenCalledTimes(1);
        expect(checkBudgetAlerts).toHaveBeenCalledTimes(1);
        expect(captureLatestGoldPriceSnapshot).toHaveBeenCalledTimes(2);
        expect(pruneOldGoldPriceSnapshots).toHaveBeenCalledTimes(1);
    });
});
