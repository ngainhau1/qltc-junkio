const { Budget, Transaction, Notification, FamilyMember } = require('../models');
const { Op } = require('sequelize');
const { serializeNotification } = require('../utils/notificationPresenter');

const getStartOfDay = (date) => {
    const value = new Date(date);
    value.setHours(0, 0, 0, 0);
    return value;
};

const getRecipientsForBudget = async (budget, familyMembersCache) => {
    if (budget.user_id) {
        return [budget.user_id];
    }

    if (!budget.family_id) {
        return [];
    }

    if (!familyMembersCache.has(budget.family_id)) {
        const familyMembers = await FamilyMember.findAll({
            where: { family_id: budget.family_id },
            attributes: ['user_id']
        });

        familyMembersCache.set(
            budget.family_id,
            [...new Set(familyMembers.map((member) => member.user_id).filter(Boolean))]
        );
    }

    return familyMembersCache.get(budget.family_id);
};

async function checkBudgetAlerts() {
    try {
        const today = new Date();
        const dayStart = getStartOfDay(today);
        const budgets = await Budget.findAll({
            where: {
                start_date: { [Op.lte]: today },
                end_date: { [Op.gte]: today }
            }
        });

        let alertCount = 0;
        const familyMembersCache = new Map();

        for (const budget of budgets) {
            const totalSpent = await Transaction.sum('amount', {
                where: {
                    category_id: budget.category_id,
                    type: 'EXPENSE',
                    date: { [Op.between]: [budget.start_date, budget.end_date] }
                }
            }) || 0;

            const limit = parseFloat(budget.amount_limit);
            if (limit <= 0) {
                continue;
            }

            const ratio = totalSpent / limit;

            if (ratio < 0.8) {
                continue;
            }

            const level = ratio >= 1.0 ? 'EXCEEDED' : 'WARNING';
            const recipients = await getRecipientsForBudget(budget, familyMembersCache);

            for (const userId of recipients) {
                const existing = await Notification.findOne({
                    where: {
                        user_id: userId,
                        type: `BUDGET_${level}`,
                        reference_id: budget.id,
                        created_at: { [Op.gte]: dayStart }
                    }
                });

                if (existing) {
                    continue;
                }

                const notification = await Notification.create({
                    user_id: userId,
                    type: `BUDGET_${level}`,
                    title: level === 'WARNING'
                        ? 'Sap vuot ngan sach!'
                        : 'Da vuot ngan sach!',
                    message: `Da chi ${Math.round(totalSpent).toLocaleString()}/${Math.round(limit).toLocaleString()} (${Math.round(ratio * 100)}%)`,
                    reference_id: budget.id
                });

                try {
                    const io = require('../config/socket').getIO();
                    io.to(userId).emit('NEW_NOTIFICATION', serializeNotification(notification));
                } catch (err) {
                    console.error('Socket emit error:', err);
                }

                alertCount++;
            }
        }

        console.log(`   Budget alerts: ${alertCount} new alerts created`);
    } catch (error) {
        console.error('Budget alert check failed:', error);
    }
}

module.exports = { checkBudgetAlerts };
