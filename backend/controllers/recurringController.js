const { RecurringPattern } = require('../models');
const { success, notFound, serverError } = require('../utils/responseHelper');
const { executeDueRecurringPatterns } = require('../services/recurringExecutionService');

exports.getPatterns = async (req, res) => {
    try {
        const patterns = await RecurringPattern.findAll({
            where: { user_id: req.user.id },
            order: [['created_at', 'DESC']],
        });

        return success(res, patterns, 'RECURRING_LIST_FETCH_SUCCESS');
    } catch (error) {
        console.error('Error fetching recurring patterns:', error);
        return serverError(res, 'RECURRING_LOAD_FAILED');
    }
};

exports.createPattern = async (req, res) => {
    try {
        const { wallet_id, category_id, amount, type, description, frequency, next_run_date } =
            req.body;

        const pattern = await RecurringPattern.create({
            user_id: req.user.id,
            wallet_id,
            category_id,
            amount,
            type: type || 'EXPENSE',
            description,
            frequency,
            next_run_date,
            is_active: true,
        });

        return success(res, pattern, 'RECURRING_CREATE_SUCCESS', 201);
    } catch (error) {
        console.error('Error creating recurring pattern:', error);
        return serverError(res, 'RECURRING_CREATE_FAILED');
    }
};

exports.updatePattern = async (req, res) => {
    try {
        const pattern = await RecurringPattern.findOne({
            where: { id: req.params.id, user_id: req.user.id },
        });

        if (!pattern) {
            return notFound(res, 'RECURRING_NOT_FOUND');
        }

        const { amount, frequency, is_active, next_run_date, description } = req.body;

        await pattern.update({
            amount: amount !== undefined ? amount : pattern.amount,
            frequency: frequency !== undefined ? frequency : pattern.frequency,
            is_active: is_active !== undefined ? is_active : pattern.is_active,
            next_run_date: next_run_date !== undefined ? next_run_date : pattern.next_run_date,
            description: description !== undefined ? description : pattern.description,
        });

        return success(res, pattern, 'RECURRING_UPDATE_SUCCESS');
    } catch (error) {
        console.error('Error updating recurring pattern:', error);
        return serverError(res, 'RECURRING_UPDATE_FAILED');
    }
};

exports.deletePattern = async (req, res) => {
    try {
        const pattern = await RecurringPattern.findOne({
            where: { id: req.params.id, user_id: req.user.id },
        });

        if (!pattern) {
            return notFound(res, 'RECURRING_NOT_FOUND');
        }

        await pattern.destroy();
        return success(res, null, 'RECURRING_DELETE_SUCCESS');
    } catch (error) {
        console.error('Error deleting recurring pattern:', error);
        return serverError(res, 'RECURRING_DELETE_FAILED');
    }
};

exports.triggerCron = async (req, res) => {
    try {
        const result = await executeDueRecurringPatterns();

        if (result.patternsCount === 0) {
            return success(res, null, 'RECURRING_TRIGGER_NOOP');
        }

        return success(res, null, 'RECURRING_TRIGGER_SUCCESS');
    } catch (error) {
        console.error('Error triggering recurring execution:', error);
        return serverError(res, 'RECURRING_TRIGGER_FAILED');
    }
};
