const regression = require('regression');
const { Op, fn, col, literal } = require('sequelize');
const { Transaction } = require('../models');

const DEFAULT_FORECAST_MONTHS = 3;
const MAX_FORECAST_MONTHS = 12;
const HISTORY_WINDOW_MONTHS = 6;

const sanitizeMonths = (value) => {
    const parsed = Number.parseInt(value, 10);

    if (!Number.isInteger(parsed) || parsed < 1) {
        return DEFAULT_FORECAST_MONTHS;
    }

    return Math.min(parsed, MAX_FORECAST_MONTHS);
};

const roundAmount = (value) => {
    const numericValue = Number(value) || 0;
    return Math.round((numericValue + Number.EPSILON) * 100) / 100;
};

const clampToCurrency = (value) => Math.max(0, roundAmount(value));

const formatMonth = (value) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
};

const addUtcMonths = (date, count) =>
    new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + count, 1));

const createPredictor = (series) => {
    if (series.length === 0) {
        return {
            predict: () => 0,
        };
    }

    if (series.length === 1) {
        const fallbackValue = clampToCurrency(series[0][1]);
        return {
            predict: () => fallbackValue,
        };
    }

    const model = regression.linear(series, { precision: 12 });

    return {
        predict: (index) => clampToCurrency(model.predict(index)[1]),
    };
};

const getHistoricalMonthlyData = async (userId) => {
    const historyStartDate = new Date();
    historyStartDate.setMonth(historyStartDate.getMonth() - HISTORY_WINDOW_MONTHS);

    const monthlyData = await Transaction.findAll({
        where: {
            user_id: userId,
            date: {
                [Op.gte]: historyStartDate,
            },
        },
        attributes: [
            [fn('date_trunc', 'month', col('date')), 'month'],
            [fn('SUM', literal('CASE WHEN type = \'INCOME\' THEN amount ELSE 0 END')), 'income'],
            [fn('SUM', literal('CASE WHEN type = \'EXPENSE\' THEN amount ELSE 0 END')), 'expense'],
        ],
        group: [fn('date_trunc', 'month', col('date'))],
        order: [[fn('date_trunc', 'month', col('date')), 'ASC']],
        raw: true,
    });

    return monthlyData.map((item) => ({
        month: formatMonth(item.month),
        income: roundAmount(item.income),
        expense: roundAmount(item.expense),
    }));
};

const buildForecastRows = (historical, months) => {
    const incomePredictor = createPredictor(
        historical.map((entry, index) => [index, Number(entry.income) || 0])
    );
    const expensePredictor = createPredictor(
        historical.map((entry, index) => [index, Number(entry.expense) || 0])
    );

    const now = new Date();
    const baseMonthDate = historical.length > 0
        ? new Date(`${historical[historical.length - 1].month}-01T00:00:00.000Z`)
        : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const seriesStartIndex = historical.length;

    return Array.from({ length: months }, (_, offset) => {
        const forecastDate = addUtcMonths(baseMonthDate, offset + 1);
        const pointIndex = seriesStartIndex + offset;
        const predictedIncome = incomePredictor.predict(pointIndex);
        const predictedExpense = expensePredictor.predict(pointIndex);

        return {
            month: formatMonth(forecastDate),
            predictedIncome,
            predictedExpense,
            predictedNet: roundAmount(predictedIncome - predictedExpense),
        };
    });
};

const buildMLForecast = async ({ userId, months }) => {
    const forecastMonths = sanitizeMonths(months);
    const historical = await getHistoricalMonthlyData(userId);
    const forecast = buildForecastRows(historical, forecastMonths);
    const warningMonth = forecast.find((entry) => entry.predictedNet < 0)?.month || null;

    return {
        historical,
        forecast,
        warningMonth,
        model: {
            type: 'SIMPLE_LINEAR_REGRESSION',
            sourceMonths: historical.length,
            forecastMonths,
        },
    };
};

module.exports = {
    buildMLForecast,
    sanitizeMonths,
};
