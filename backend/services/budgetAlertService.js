const { Budget, Transaction, Notification } = require('../models');
const { Op } = require('sequelize');

// Chạy bởi cron mỗi ngày — kiểm tra spending vs budget limit
async function checkBudgetAlerts() {
    try {
        const today = new Date();
        const budgets = await Budget.findAll({
            where: {
                start_date: { [Op.lte]: today },
                end_date: { [Op.gte]: today }
            }
        });

        let alertCount = 0;

        for (const budget of budgets) {
            // Tính tổng chi tiêu trong khoảng thời gian và category
            const totalSpent = await Transaction.sum('amount', {
                where: {
                    category_id: budget.category_id,
                    type: 'EXPENSE',
                    date: { [Op.between]: [budget.start_date, budget.end_date] }
                }
            }) || 0;

            const limit = parseFloat(budget.amount_limit);
            const ratio = totalSpent / limit;

            if (ratio >= 0.8) {
                const level = ratio >= 1.0 ? 'EXCEEDED' : 'WARNING';

                // Tránh spam: chỉ tạo 1 notification/ngày/budget
                const todayStr = today.toISOString().split('T')[0];
                const existing = await Notification.findOne({
                    where: {
                        type: `BUDGET_${level}`,
                        reference_id: budget.id,
                        createdAt: { [Op.gte]: todayStr }
                    }
                });

                if (!existing) {
                    const newNotif = await Notification.create({
                        user_id: budget.family_id,
                        type: `BUDGET_${level}`,
                        title: level === 'WARNING'
                            ? 'Sắp vượt ngân sách!'
                            : 'Đã vượt ngân sách!',
                        message: `Đã chi ${Math.round(totalSpent).toLocaleString()}/${Math.round(limit).toLocaleString()} (${Math.round(ratio * 100)}%)`,
                        reference_id: budget.id
                    });
                    
                    try {
                        const io = require('../config/socket').getIO();
                        io.to(budget.family_id).emit('NEW_NOTIFICATION', newNotif);
                    } catch (err) {
                        console.error('Socket emit error:', err);
                    }
                    
                    alertCount++;
                }
            }
        }

        console.log(`   Budget alerts: ${alertCount} new alerts created`);
    } catch (error) {
        console.error('Budget alert check failed:', error);
    }
}

module.exports = { checkBudgetAlerts };
