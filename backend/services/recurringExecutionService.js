const { Op } = require('sequelize');
const { RecurringPattern, Transaction, Wallet, sequelize } = require('../models');

const toDateOnlyString = (value) => {
    const date = new Date(value);
    return date.toISOString().split('T')[0];
};

const incrementNextRunDate = (nextRunDate, frequency) => {
    const nextDate = new Date(nextRunDate);

    if (frequency === 'DAILY') {
        nextDate.setDate(nextDate.getDate() + 1);
    } else if (frequency === 'WEEKLY') {
        nextDate.setDate(nextDate.getDate() + 7);
    } else if (frequency === 'MONTHLY') {
        nextDate.setMonth(nextDate.getMonth() + 1);
    } else if (frequency === 'YEARLY') {
        nextDate.setFullYear(nextDate.getFullYear() + 1);
    }

    return toDateOnlyString(nextDate);
};

const executeDueRecurringPatterns = async ({ today = new Date() } = {}) => {
    const todayStr = toDateOnlyString(today);
    const patterns = await RecurringPattern.findAll({
        where: {
            is_active: true,
            next_run_date: {
                [Op.lte]: todayStr
            }
        }
    });

    const result = {
        processedCount: 0,
        skippedCount: 0,
        failedCount: 0,
        patternsCount: patterns.length
    };

    for (const pattern of patterns) {
        const transaction = await sequelize.transaction();

        try {
            const wallet = await Wallet.findByPk(pattern.wallet_id, { transaction });
            if (!wallet) {
                await transaction.rollback();
                result.skippedCount++;
                continue;
            }

            const amountFloat = parseFloat(pattern.amount);
            if (pattern.type === 'EXPENSE' && parseFloat(wallet.balance) < amountFloat) {
                await transaction.rollback();
                result.skippedCount++;
                continue;
            }

            await Transaction.create({
                amount: pattern.amount,
                date: todayStr,
                description: `[Auto] ${pattern.description || 'Recurring Transaction'}`,
                type: pattern.type,
                wallet_id: pattern.wallet_id,
                category_id: pattern.category_id,
                user_id: pattern.user_id,
                family_id: wallet.family_id || null
            }, { transaction });

            if (pattern.type === 'INCOME') {
                wallet.balance = parseFloat(wallet.balance) + amountFloat;
            } else if (pattern.type === 'EXPENSE') {
                wallet.balance = parseFloat(wallet.balance) - amountFloat;
            }

            await wallet.save({ transaction });

            pattern.next_run_date = incrementNextRunDate(pattern.next_run_date, pattern.frequency);
            await pattern.save({ transaction });

            await transaction.commit();
            result.processedCount++;
        } catch (error) {
            await transaction.rollback();
            result.failedCount++;
            console.error(`Recurring execution failed for pattern ${pattern.id}:`, error);
        }
    }

    return result;
};

module.exports = {
    executeDueRecurringPatterns,
    incrementNextRunDate,
    toDateOnlyString
};
