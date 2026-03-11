const { RecurringPattern, Wallet, Category, Transaction } = require('../models');

// GET /api/recurring
exports.getPatterns = async (req, res) => {
    try {
        const userId = req.user.id;
        const patterns = await RecurringPattern.findAll({
            where: { user_id: userId },
            order: [['created_at', 'DESC']]
        });
        res.json(patterns);
    } catch (error) {
        console.error('Error fetching recurring patterns:', error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
};

// POST /api/recurring
exports.createPattern = async (req, res) => {
    try {
        const userId = req.user.id;
        const { wallet_id, category_id, amount, type, description, frequency, next_run_date } = req.body;

        if (!wallet_id || !amount || !frequency || !next_run_date) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const pattern = await RecurringPattern.create({
            user_id: userId,
            wallet_id,
            category_id,
            amount,
            type: type || 'EXPENSE',
            description,
            frequency,
            next_run_date,
            is_active: true
        });

        res.status(201).json(pattern);
    } catch (error) {
        console.error('Error creating recurring pattern:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// PUT /api/recurring/:id
exports.updatePattern = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { amount, frequency, is_active, next_run_date, description } = req.body;

        const pattern = await RecurringPattern.findOne({ where: { id, user_id: userId } });
        if (!pattern) return res.status(404).json({ message: 'Pattern not found' });

        await pattern.update({
            amount: amount !== undefined ? amount : pattern.amount,
            frequency: frequency !== undefined ? frequency : pattern.frequency,
            is_active: is_active !== undefined ? is_active : pattern.is_active,
            next_run_date: next_run_date !== undefined ? next_run_date : pattern.next_run_date,
            description: description !== undefined ? description : pattern.description
        });

        res.json(pattern);
    } catch (error) {
        console.error('Error updating recurring pattern:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// DELETE /api/recurring/:id
exports.deletePattern = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const pattern = await RecurringPattern.findOne({ where: { id, user_id: userId } });
        if (!pattern) return res.status(404).json({ message: 'Pattern not found' });

        await pattern.destroy();
        res.json({ message: 'Recurring pattern deleted successfully' });
    } catch (error) {
        console.error('Error deleting recurring pattern:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// POST /api/recurring/trigger-cron (DEBUG OR MANUAL)
exports.triggerCron = async (req, res) => {
    const { Op } = require('sequelize');
    const { sequelize } = require('../models');
    try {
        const today = new Date().toISOString().split('T')[0];
        const patterns = await RecurringPattern.findAll({
            where: { is_active: true, next_run_date: { [Op.lte]: today } }
        });

        if (patterns.length === 0) {
            return res.json({ message: 'Không có giao dịch định kỳ nào cần thực thi hôm nay.' });
        }

        let count = 0;
        for (const pattern of patterns) {
            const t = await sequelize.transaction();
            try {
                await Transaction.create({
                    amount: pattern.amount,
                    date: today,
                    description: `[Tự Động] ${pattern.description || 'Giao dịch định kỳ'}`,
                    type: pattern.type,
                    wallet_id: pattern.wallet_id,
                    category_id: pattern.category_id,
                    user_id: pattern.user_id
                }, { transaction: t });

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
                await t.commit();
                count++;
            } catch (err) {
                await t.rollback();
                console.error(`Lỗi chạy cron pattern=${pattern.id}:`, err);
            }
        }
        res.json({ message: `Đã chạy thành công ${count} giao dịch định kỳ.` });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi', error: error.message });
    }
};
