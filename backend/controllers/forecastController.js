const { success, serverError } = require('../utils/responseHelper');
const { buildMLForecast } = require('../services/forecastMLService');

const sendForecast = async (req, res, messageKey) => {
    try {
        const data = await buildMLForecast({
            userId: req.user.id,
            months: req.query.months,
        });

        success(res, data, messageKey);
    } catch (error) {
        console.error('Forecast error:', error);
        serverError(res, 'FORECAST_LOAD_FAILED');
    }
};

exports.getForecast = async (req, res) => sendForecast(req, res, 'FORECAST_RETRIEVED');

exports.getMLForecast = async (req, res) => sendForecast(req, res, 'FORECAST_ML_RETRIEVED');
