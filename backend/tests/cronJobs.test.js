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

const cron = require('node-cron');
const { executeDueRecurringPatterns } = require('../services/recurringExecutionService');
const { checkBudgetAlerts } = require('../services/budgetAlertService');
const { startCronJobs } = require('../services/cronJobs');

describe('cronJobs', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        cron.__jobs.length = 0;
    });

    it('registers recurring and budget jobs with the expected schedules', () => {
        startCronJobs();

        expect(cron.schedule).toHaveBeenCalledTimes(2);
        expect(cron.__jobs.map((job) => job.expression)).toEqual(['5 0 * * *', '0 8 * * *']);
    });

    it('runs the shared recurring executor and budget alert service', async () => {
        startCronJobs();

        await cron.__jobs[0].handler();
        await cron.__jobs[1].handler();

        expect(executeDueRecurringPatterns).toHaveBeenCalledTimes(1);
        expect(checkBudgetAlerts).toHaveBeenCalledTimes(1);
    });
});
