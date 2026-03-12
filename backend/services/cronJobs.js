const cron = require('node-cron');
const { Op } = require('sequelize');
const { RecurringPattern, Transaction, Wallet, sequelize } = require('../models');

// Job chạy vào 0h00 mỗi ngày để kiểm tra các giao dịch định kỳ
const startCronJobs = () => {
    console.log(' Khởi tạo hệ thống Giao dịch định kỳ (Recurring Transactions Engine)...');

    // Mẫu cron: '0 0 * * *' có nghĩa là 0 phút 0 giờ mỗi ngày
    cron.schedule('0 0 * * *', async () => {
        console.log(' Đang kiểm tra các Giao dịch định kỳ cần thực thi trong ngày hôm nay...');
        const today = new Date().toISOString().split('T')[0];

        try {
            // Lấy tất cả patterns có next_run_date <= hôm nay và đang active
            const patterns = await RecurringPattern.findAll({
                where: {
                    is_active: true,
                    next_run_date: {
                        [Op.lte]: today
                    }
                }
            });

            if (patterns.length === 0) {
                console.log(' Không có giao dịch định kỳ nào cần thực thi hôm nay.');
                return;
            }

            for (const pattern of patterns) {
                const t = await sequelize.transaction();
                try {
                    // 1. Tạo Transaction mới
                    await Transaction.create({
                        amount: pattern.amount,
                        date: today,
                        description: `[Tự Động] ${pattern.description || 'Giao dịch định kỳ'}`,
                        type: pattern.type,
                        wallet_id: pattern.wallet_id,
                        category_id: pattern.category_id,
                        user_id: pattern.user_id
                    }, { transaction: t });

                    // 2. Cập nhật số dư Ví (Wallet Balance)
                    const wallet = await Wallet.findByPk(pattern.wallet_id, { transaction: t });
                    if (wallet) {
                        const amountFloat = parseFloat(pattern.amount);
                        if (pattern.type === 'INCOME') {
                            wallet.balance = parseFloat(wallet.balance) + amountFloat;
                        } else if (pattern.type === 'EXPENSE') {
                            wallet.balance = parseFloat(wallet.balance) - amountFloat;
                        }
                        await wallet.save({ transaction: t });
                    }

                    // 3. Tính toán next_run_date tiếp theo
                    const nextDate = new Date(pattern.next_run_date);
                    if (pattern.frequency === 'DAILY') {
                        nextDate.setDate(nextDate.getDate() + 1);
                    } else if (pattern.frequency === 'WEEKLY') {
                        nextDate.setDate(nextDate.getDate() + 7);
                    } else if (pattern.frequency === 'MONTHLY') {
                        nextDate.setMonth(nextDate.getMonth() + 1);
                    } else if (pattern.frequency === 'YEARLY') {
                        nextDate.setFullYear(nextDate.getFullYear() + 1);
                    }

                    pattern.next_run_date = nextDate.toISOString().split('T')[0];
                    await pattern.save({ transaction: t });

                    // 4. Commit kết quả
                    await t.commit();
                    console.log(` Thực thi thành công mẫu định kỳ ID: ${pattern.id}`);

                } catch (err) {
                    await t.rollback();
                    console.error(` Lỗi khi thực thi mẫu định kỳ ID: ${pattern.id}`, err);
                }
            }
        } catch (error) {
            console.error(' Lỗi Engine Cron:', error);
        }
    });

    // Budget Alert: Chạy mỗi ngày lúc 8h sáng
    const { checkBudgetAlerts } = require('./budgetAlertService');
    cron.schedule('0 8 * * *', async () => {
        console.log(' Đang kiểm tra cảnh báo ngân sách...');
        await checkBudgetAlerts();
    });
};

module.exports = { startCronJobs };
