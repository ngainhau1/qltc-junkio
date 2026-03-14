const { Transaction, Wallet, FamilyMember, Goal, Category } = require('../models');
const { Op } = require('sequelize');

// GET /api/analytics/dashboard
exports.getDashboardStats = async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. Get wallets belonging to user or user's families
        const userFamilies = await FamilyMember.findAll({
            where: { user_id: userId },
            attributes: ['family_id']
        });
        const familyIds = userFamilies.map(f => f.family_id);

        const wallets = await Wallet.findAll({
            where: {
                [Op.or]: [
                    { user_id: userId },
                    { family_id: { [Op.in]: familyIds } }
                ]
            }
        });

        const walletIds = wallets.map(w => w.id);
        const totalAssets = wallets.reduce((sum, w) => sum + parseFloat(w.balance), 0);

        // 2. Get Income and Expenses for the current month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const transactionsThisMonth = await Transaction.findAll({
            where: {
                wallet_id: { [Op.in]: walletIds },
                date: { [Op.gte]: startOfMonth }
            }
        });

        const totalIncome = transactionsThisMonth
            .filter(t => t.type === 'INCOME')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);

        const totalExpense = transactionsThisMonth
            .filter(t => t.type === 'EXPENSE')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);

        // 3. Get Recent Transactions
        const recentTransactions = await Transaction.findAll({
            where: { wallet_id: { [Op.in]: walletIds } },
            order: [['date', 'DESC']],
            limit: 5,
            include: [{ model: Category, attributes: ['name', 'icon'] }]
        });

        res.success({
            stats: {
                totalAssets,
                totalIncome,
                totalExpense,
                activeWalletsCount: wallets.length,
                transactionsThisMonthCount: transactionsThisMonth.length
            },
            recentTransactions
        });
    } catch (error) {
        console.error('Error fetching dashboard analytics:', error);
        res.error('Server error', 500);
    }
};

// GET /api/analytics/reports
exports.getReports = async (req, res) => {
    try {
        const userId = req.user.id;
        const { year, month } = req.query; // optional params

        // Basic grouping logic for charts
        // E.g., expense by category
        res.success({ message: 'Reports data will be aggregated here based on queries' });
    } catch (error) {
        console.error('Error fetching reports:', error);
        res.error('Server error', 500);
    }
};
