const { RecurringPattern } = require('../models');
const { success, error: sendError, notFound, serverError } = require('../utils/responseHelper');
const { executeDueRecurringPatterns } = require('../services/recurringExecutionService');

exports.getPatterns = async (req, res) => {
    try {
        const patterns = await RecurringPattern.findAll({
            where: { user_id: req.user.id },
            order: [['created_at', 'DESC']]
        });

        success(res, patterns, 'Lay danh sach giao dich dinh ky thanh cong');
    } catch (error) {
        console.error('Error fetching recurring patterns:', error);
        serverError(res, error.message || 'Server error');
    }
};

exports.createPattern = async (req, res) => {
    try {
        const { wallet_id, category_id, amount, type, description, frequency, next_run_date } = req.body;

        if (!wallet_id || !amount || !frequency || !next_run_date) {
            return sendError(res, 'Thieu thong tin bat buoc', 400);
        }

        const pattern = await RecurringPattern.create({
            user_id: req.user.id,
            wallet_id,
            category_id,
            amount,
            type: type || 'EXPENSE',
            description,
            frequency,
            next_run_date,
            is_active: true
        });

        success(res, pattern, 'Tao giao dich dinh ky thanh cong', 201);
    } catch (error) {
        console.error('Error creating recurring pattern:', error);
        serverError(res, 'Server error');
    }
};

exports.updatePattern = async (req, res) => {
    try {
        const pattern = await RecurringPattern.findOne({
            where: { id: req.params.id, user_id: req.user.id }
        });

        if (!pattern) {
            return notFound(res, 'Khong tim thay giao dich dinh ky');
        }

        const { amount, frequency, is_active, next_run_date, description } = req.body;

        await pattern.update({
            amount: amount !== undefined ? amount : pattern.amount,
            frequency: frequency !== undefined ? frequency : pattern.frequency,
            is_active: is_active !== undefined ? is_active : pattern.is_active,
            next_run_date: next_run_date !== undefined ? next_run_date : pattern.next_run_date,
            description: description !== undefined ? description : pattern.description
        });

        success(res, pattern, 'Cap nhat giao dich dinh ky thanh cong');
    } catch (error) {
        console.error('Error updating recurring pattern:', error);
        serverError(res, 'Server error');
    }
};

exports.deletePattern = async (req, res) => {
    try {
        const pattern = await RecurringPattern.findOne({
            where: { id: req.params.id, user_id: req.user.id }
        });

        if (!pattern) {
            return notFound(res, 'Khong tim thay giao dich dinh ky');
        }

        await pattern.destroy();
        success(res, null, 'Xoa giao dich dinh ky thanh cong');
    } catch (error) {
        console.error('Error deleting recurring pattern:', error);
        serverError(res, 'Server error');
    }
};

exports.triggerCron = async (req, res) => {
    try {
        const result = await executeDueRecurringPatterns();

        if (result.patternsCount === 0) {
            return success(res, null, 'Khong co giao dich dinh ky nao can thuc thi hom nay.');
        }

        success(res, null, `Da chay thanh cong ${result.processedCount} giao dich dinh ky.`);
    } catch (error) {
        serverError(res, 'Loi ' + error.message);
    }
};
