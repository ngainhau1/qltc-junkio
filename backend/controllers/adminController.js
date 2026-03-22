const { User, Transaction, Wallet, Family, Goal, Budget, Category, sequelize } = require('../models');
const { Op, fn, col } = require('sequelize');
const { success, error: sendError } = require('../utils/responseHelper');

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

        // Use mock res to fetch from the other endpoints
        const createMockRes = () => ({
            status: function() { return this; },
            json: function(payload) { this.payload = payload; return this; }
        });

        const resAnalytics = createMockRes();
        await exports.getAnalytics(req, resAnalytics);
        const analyticsData = resAnalytics.payload?.data || {};

        const resFinancial = createMockRes();
        await exports.getFinancialOverview(req, resFinancial);
        const financialData = resFinancial.payload?.data || {};

        success(res, { 
            totalUsers, totalTransactions, totalFamilies, recentUsers,
            analytics: analyticsData,
            financialOverview: financialData
        }, 'Thành công');
    } catch (error) {
        console.error('Admin dashboard error:', error);
        sendError(res, 'Server error', 500);
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

        success(res, {
            stats: { totalWallets, totalGoals, totalBudgets },
            userGrowth: userGrowth.map(u => ({ month: new Date(u.month).toLocaleDateString('vi-VN', { month: 'short', year: '2-digit' }), count: parseInt(u.count) })),
            topCategories: topCategories.map(c => ({ 
                ...c, 
                name: c.name || 'Chưa phân loại',
                icon: c.icon || 'HelpCircle',
                total: parseFloat(c.total) 
            })),
            weeklyActivity: weeklyActivity.map(a => ({ date: new Date(a.date).toLocaleDateString('vi-VN', { weekday: 'short' }), count: parseInt(a.count) }))
        }, 'Thành công');
    } catch (error) {
        console.error('Admin analytics error:', error);
        sendError(res, 'Server error', 500);
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
        success(res, { users: rows, total: count, page: parseInt(page), totalPages: Math.ceil(count / parseInt(limit)) }, 'Thành công');
    } catch (error) {
        console.error('Admin listUsers error:', error);
        sendError(res, 'Server error', 500);
    }
};

// GET /api/admin/users/:id
exports.getUserDetail = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id, {
            attributes: { exclude: ['password_hash'] },
            include: [
                { model: Wallet, attributes: ['id', 'name', 'balance', 'currency'] },
                { model: Family, as: 'Families', attributes: ['id', 'name'], through: { attributes: [] } }
            ]
        });
        if (!user) return sendError(res, 'User not found', 404);
        
        const transactionCount = await Transaction.count({ where: { user_id: user.id } });
        success(res, { ...user.toJSON(), transactionCount }, 'Thành công');
    } catch (error) {
        console.error('Admin getUserDetail error:', error);
        sendError(res, 'Server error', 500);
    }
};

// DELETE /api/admin/users/:id
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return sendError(res, 'User not found', 404);
        if (user.id === req.user.id) return sendError(res, 'Cannot delete yourself', 400);

        await user.destroy();
        success(res, null, 'Xóa người dùng thành công');
    } catch (error) {
        console.error('Admin deleteUser error:', error);
        sendError(res, 'Server error', 500);
    }
};

// PUT /api/admin/users/:id/toggle-lock
exports.toggleLock = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id, {
            attributes: { exclude: ['password_hash'] }
        });
        if (!user) return sendError(res, 'User not found', 404);
        if (user.id === req.user.id) return sendError(res, 'Cannot lock yourself', 400);

        user.is_locked = !user.is_locked;
        await user.save();
        success(res, { user }, user.is_locked ? 'Account locked' : 'Account unlocked');
    } catch (error) {
        console.error('Admin toggleLock error:', error);
        sendError(res, 'Server error', 500);
    }
};

// PUT /api/admin/users/:id/role
exports.changeRole = async (req, res) => {
    try {
        const { role } = req.body;
        if (!['member', 'staff', 'admin'].includes(role)) {
            return sendError(res, 'Invalid role', 400);
        }
        const user = await User.findByPk(req.params.id, {
            attributes: { exclude: ['password_hash'] }
        });
        if (!user) return sendError(res, 'User not found', 404);
        if (user.id === req.user.id) return sendError(res, 'Cannot change own role', 400);

        user.role = role;
        await user.save();
        success(res, { user }, `Role changed to ${role}`);
    } catch (error) {
        console.error('Admin changeRole error:', error);
        sendError(res, 'Server error', 500);
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
        
        success(res, { logs: rows, total: count, page: parseInt(page), totalPages: Math.ceil(count / parseInt(limit)) }, 'Thành công');
    } catch (error) {
        console.error('Admin getLogs error:', error);
        sendError(res, 'Server error', 500);
    }
};

// GET /api/admin/financial-overview
exports.getFinancialOverview = async (req, res) => {
    try {
        const { Op } = require('sequelize');
        const { sequelize, Wallet, Transaction, User, Budget } = require('../models');

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
            WHERE "date" >= :sixMonthsAgo AND "type" IN ('INCOME', 'EXPENSE')
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
            JOIN "Transactions" t ON u.id = t.user_id AND t.type = 'EXPENSE'
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
                    type: 'EXPENSE',
                    date: { [Op.gte]: b.start_date, [Op.lte]: b.end_date }
                }
            });
            if ((spent || 0) > b.amount) overBudgetCount++;
        }
        const budgetCompliance = totalBudgetCount > 0 
            ? Math.round(((totalBudgetCount - overBudgetCount) / totalBudgetCount) * 100) 
            : 100;

        success(res, {
            systemBalance,
            revenueTrends,
            topSpenders,
            budgetCompliance
        }, 'Thành công');

    } catch (error) {
        console.error('Admin getFinancialOverview error:', error);
        sendError(res, 'Server error', 500);
    }
};
