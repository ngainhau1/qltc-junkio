const { User, Transaction, Wallet, Family, Goal, Budget, Category, sequelize } = require('../models');
const { Op, fn, col } = require('sequelize');

// GET /api/admin/dashboard
exports.getDashboard = async (req, res) => {
    try {
        const [totalUsers, totalTransactions, totalFamilies] = await Promise.all([
            User.count(),
            Transaction.count(),
            Family.count()
        ]);
        const recentUsers = await User.findAll({
            order: [['createdAt', 'DESC']], limit: 10,
            attributes: ['id', 'name', 'email', 'role', 'createdAt']
        });
        res.success({ totalUsers, totalTransactions, totalFamilies, recentUsers });
    } catch (error) {
        console.error('Admin dashboard error:', error);
        res.error('Server error', 500);
    }
};

// GET /api/admin/analytics
exports.getAnalytics = async (req, res) => {
    try {
        const [totalWallets, totalGoals, totalBudgets] = await Promise.all([
            Wallet.count(),
            Goal.count(),
            Budget.count()
        ]);

        // User Growth (6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);
        sixMonthsAgo.setHours(0,0,0,0);
        
        const isSqlite = sequelize?.getDialect && sequelize.getDialect() === 'sqlite';
        const monthExpr = isSqlite
            ? fn('strftime', '%Y-%m', col('createdAt'))
            : fn('date_trunc', 'month', col('createdAt'));

        const userGrowth = await User.findAll({
            where: { createdAt: { [Op.gte]: sixMonthsAgo } },
            attributes: [
                [monthExpr, 'month'],
                [fn('COUNT', col('id')), 'count']
            ],
            group: [monthExpr],
            order: [[monthExpr, 'ASC']],
            raw: true
        });

        // Top 5 Categories (Expenses)
        const topCategories = await Transaction.findAll({
            where: { type: 'EXPENSE' },
            attributes: [
                'category_id',
                [col('Category.name'), 'name'],
                [col('Category.icon'), 'icon'],
                [fn('SUM', col('amount')), 'total']
            ],
            include: [{ model: Category, attributes: [] }],
            group: ['category_id', 'Category.id', 'Category.name', 'Category.icon'],
            order: [[fn('SUM', col('amount')), 'DESC']],
            limit: 5,
            raw: true
        });

        // Weekly Activity (Current Week Transactions)
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + (startOfWeek.getDay() === 0 ? -6 : 1)); // Monday
        startOfWeek.setHours(0,0,0,0);
        
        const dayExpr = isSqlite
            ? fn('strftime', '%Y-%m-%d', col('createdAt'))
            : fn('date_trunc', 'day', col('createdAt'));

        const weeklyActivity = await Transaction.findAll({
            where: { createdAt: { [Op.gte]: startOfWeek } },
            attributes: [
                [dayExpr, 'date'],
                [fn('COUNT', col('id')), 'count']
            ],
            group: [dayExpr],
            order: [[dayExpr, 'ASC']],
            raw: true
        });

        res.success({
            stats: { totalWallets, totalGoals, totalBudgets },
            userGrowth: userGrowth.map(u => ({ month: new Date(u.month).toLocaleDateString('vi-VN', { month: 'short', year: '2-digit' }), count: parseInt(u.count) })),
            topCategories: topCategories.map(c => ({ 
                ...c, 
                name: c.name || 'Chưa phân loại',
                icon: c.icon || 'HelpCircle',
                total: parseFloat(c.total) 
            })),
            weeklyActivity: weeklyActivity.map(a => ({ date: new Date(a.date).toLocaleDateString('vi-VN', { weekday: 'short' }), count: parseInt(a.count) }))
        });
    } catch (error) {
        console.error('Admin analytics error:', error);
        res.error('Server error', 500);
    }
};

// GET /api/admin/users?page=1&limit=20&search=keyword&role=all&status=all
exports.listUsers = async (req, res) => {
    try {
        const { page = 1, limit = 20, search, role, status } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        
        const where = {};
        if (search) {
            where[Op.or] = [
                { name: { [Op.iLike]: `%${search}%` } },
                { email: { [Op.iLike]: `%${search}%` } }
            ];
        }
        if (role && role !== 'all') where.role = role;
        if (status && status !== 'all') {
            where.is_locked = status === 'locked';
        }

        const { count, rows } = await User.findAndCountAll({
            where, offset, limit: parseInt(limit),
            attributes: { exclude: ['password_hash'] },
            order: [['createdAt', 'DESC']]
        });
        res.json({ users: rows, total: count, page: parseInt(page), totalPages: Math.ceil(count / parseInt(limit)) });
    } catch (error) {
        console.error('Admin listUsers error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// GET /api/admin/users/:id
exports.getUserDetail = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id, {
            attributes: { exclude: ['password_hash'] },
            include: [
                { model: Wallet, attributes: ['id', 'name', 'balance', 'currency'] },
                { model: Family, attributes: ['id', 'name'], through: { attributes: [] } } // Assuming many-to-many or direct depends on associations
            ]
        });
        if (!user) return res.status(404).json({ message: 'User not found' });
        
        const transactionCount = await Transaction.count({ where: { user_id: user.id } });
        res.json({ ...user.toJSON(), transactionCount });
    } catch (error) {
        console.error('Admin getUserDetail error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// DELETE /api/admin/users/:id
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.id === req.user.id) return res.status(400).json({ message: 'Cannot delete yourself' });

        await user.destroy();
        res.json({ message: 'Xóa người dùng thành công' });
    } catch (error) {
        console.error('Admin deleteUser error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// PUT /api/admin/users/:id/toggle-lock
exports.toggleLock = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id, {
            attributes: { exclude: ['password_hash'] }
        });
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.id === req.user.id) return res.status(400).json({ message: 'Cannot lock yourself' });

        user.is_locked = !user.is_locked;
        await user.save();
        res.json({ message: user.is_locked ? 'Account locked' : 'Account unlocked', user });
    } catch (error) {
        console.error('Admin toggleLock error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// PUT /api/admin/users/:id/role
exports.changeRole = async (req, res) => {
    try {
        const { role } = req.body;
        if (!['member', 'admin'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }
        const user = await User.findByPk(req.params.id, {
            attributes: { exclude: ['password_hash'] }
        });
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.id === req.user.id) return res.status(400).json({ message: 'Cannot change own role' });

        user.role = role;
        await user.save();
        res.json({ message: `Role changed to ${role}`, user });
    } catch (error) {
        console.error('Admin changeRole error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// GET /api/admin/logs?page=1&limit=50&action=USER_LOGIN
exports.getLogs = async (req, res) => {
    const { AuditLog } = require('../models');
    try {
        const { page = 1, limit = 50, action } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const where = action && action !== 'ALL' ? { action } : {};

        const { count, rows } = await AuditLog.findAndCountAll({
            where,
            offset,
            limit: parseInt(limit),
            order: [['createdAt', 'DESC']],
            include: [{ model: User, attributes: ['id', 'name', 'email'] }]
        });
        
        res.success({ logs: rows, total: count, page: parseInt(page), totalPages: Math.ceil(count / parseInt(limit)) });
    } catch (error) {
        console.error('Admin getLogs error:', error);
        res.error('Server error', 500);
    }
};

// GET /api/admin/financial-overview
exports.getFinancialOverview = async (req, res) => {
    try {
        const { Op } = require('sequelize');
        const { sequelize, Wallet, Transaction, Budget } = require('../models');

        // 1. System wallets total
        const systemBalanceResult = await Wallet.sum('balance');
        const systemBalance = parseFloat(systemBalanceResult) || 0;

        // 2. Revenue trends (last 6 months income vs expense)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);
        sixMonthsAgo.setHours(0, 0, 0, 0);

        const revenueTrendsRaw = await sequelize.query(`
            SELECT 
                DATE_TRUNC('month', "date") AS month,
                type,
                SUM("amount") AS total
            FROM "Transactions"
            WHERE "date" >= :sixMonthsAgo AND "type" IN ('income', 'expense') AND "deletedAt" IS NULL
            GROUP BY DATE_TRUNC('month', "date"), type
            ORDER BY month ASC
        `, {
            replacements: { sixMonthsAgo },
            type: sequelize.QueryTypes.SELECT
        });

        const trendsMap = {};
        for(let i=0; i<6; i++) {
            const d = new Date(sixMonthsAgo);
            d.setMonth(d.getMonth() + i);
            const m = d.toISOString().slice(0, 7); // YYYY-MM
            trendsMap[m] = { month: new Date(d).toLocaleDateString('vi-VN', { month: 'short', year: '2-digit' }), income: 0, expense: 0 };
        }
        revenueTrendsRaw.forEach(r => {
            const m = new Date(r.month).toISOString().slice(0, 7);
            if (trendsMap[m]) {
                trendsMap[m][r.type] = parseFloat(r.total) || 0;
            }
        });
        const revenueTrends = Object.values(trendsMap);


        // 3. Top 5 spenders
        const topSpendersRaw = await sequelize.query(`
            SELECT u.id, u.name, u.email, SUM(CAST(t.amount AS numeric)) as total_spent
            FROM "Users" u
            JOIN "Transactions" t ON u.id = t.user_id AND t.type = 'expense' AND t."deletedAt" IS NULL
            GROUP BY u.id
            ORDER BY total_spent DESC
            LIMIT 5
        `, { type: sequelize.QueryTypes.SELECT });
        
        const topSpenders = topSpendersRaw.map(s => ({
            ...s,
            total_spent: parseFloat(s.total_spent) || 0
        }));

        // 4. Budget compliance
        const budgets = await Budget.findAll();
        let overBudgetCount = 0;
        let totalBudgetCount = budgets.length;

        for (const b of budgets) {
            const spent = await Transaction.sum('amount', {
                where: {
                    category_id: b.category_id,
                    type: 'expense',
                    date: { [Op.gte]: b.start_date, [Op.lte]: b.end_date }
                }
            });
            if ((spent || 0) > b.amount) overBudgetCount++;
        }
        const budgetCompliance = totalBudgetCount > 0 
            ? Math.round(((totalBudgetCount - overBudgetCount) / totalBudgetCount) * 100) 
            : 100;

        res.success({
            systemBalance,
            revenueTrends,
            topSpenders,
            budgetCompliance
        });

    } catch (error) {
        console.error('Admin getFinancialOverview error:', error);
        res.error('Server error', 500);
    }
};
