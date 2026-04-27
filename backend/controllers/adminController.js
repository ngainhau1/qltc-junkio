const { User, Transaction, Wallet, Family, Goal, Budget, Category, sequelize } = require('../models');
const { Op, fn, col } = require('sequelize');
const { success, error: sendError } = require('../utils/responseHelper');

// GHI CHÚ HỌC TẬP - Phần quản trị của Thành Đạt:
// Controller này chỉ dành cho admin. Nó gom dữ liệu toàn hệ thống, quản lý user,
// đổi quyền, khóa tài khoản, xóa user và đọc nhật ký hoạt động.

/**
 * Tạo điều kiện tìm kiếm người dùng theo tên hoặc email.
 * PostgreSQL dùng iLike để tìm không phân biệt hoa/thường; môi trường khác dùng like.
 */
const buildSearchWhere = (search) => {
    if (!search) {
        return {};
    }

    const likeOperator = sequelize?.getDialect && sequelize.getDialect() === 'postgres' ? Op.iLike : Op.like;
    return {
        [Op.or]: [
            { name: { [likeOperator]: `%${search}%` } },
            { email: { [likeOperator]: `%${search}%` } }
        ]
    };
};

exports.getDashboard = async (req, res) => {
    try {
        // Ba phép đếm độc lập nên chạy song song để giảm thời gian phản hồi.
        const [totalUsers, totalTransactions, totalFamilies] = await Promise.all([
            User.count(),
            Transaction.count(),
            Family.count()
        ]);

        const recentUsers = await User.findAll({
            order: [['createdAt', 'DESC']],
            limit: 10,
            attributes: ['id', 'name', 'email', 'role', 'createdAt']
        });

        const createMockRes = () => ({
            status() {
                return this;
            },
            json(payload) {
                this.payload = payload;
                return this;
            }
        });

        // Tái sử dụng getAnalytics và getFinancialOverview để dashboard có dữ liệu tổng hợp nhất quán.
        const analyticsResponse = createMockRes();
        await exports.getAnalytics(req, analyticsResponse);

        const financialResponse = createMockRes();
        await exports.getFinancialOverview(req, financialResponse);

        success(res, {
            totalUsers,
            totalTransactions,
            totalFamilies,
            recentUsers,
            analytics: analyticsResponse.payload?.data || {},
            financialOverview: financialResponse.payload?.data || {}
        }, 'ADMIN_DASHBOARD_LOADED');
    } catch (err) {
        console.error('Admin dashboard error:', err);
        sendError(res, 'ADMIN_DASHBOARD_FAILED', 500);
    }
};

exports.getAnalytics = async (req, res) => {
    try {
        // Các chỉ số tổng quan này dùng cho các thẻ thống kê trên đầu trang admin.
        const [totalWallets, totalGoals, totalBudgets] = await Promise.all([
            Wallet.count(),
            Goal.count(),
            Budget.count()
        ]);

        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);
        sixMonthsAgo.setHours(0, 0, 0, 0);

        const isSqlite = sequelize?.getDialect && sequelize.getDialect() === 'sqlite';
        // date_trunc dùng cho PostgreSQL; strftime dùng cho SQLite trong test.
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

        const topCategories = await Transaction.findAll({
            // Chỉ xét chi tiêu để biết danh mục nào đang được dùng nhiều nhất cho expense.
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

        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + (startOfWeek.getDay() === 0 ? -6 : 1));
        startOfWeek.setHours(0, 0, 0, 0);

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
            userGrowth: userGrowth.map((item) => ({
                month: new Date(item.month).toLocaleDateString('vi-VN', { month: 'short', year: '2-digit' }),
                count: parseInt(item.count, 10)
            })),
            topCategories: topCategories.map((item) => ({
                ...item,
                name: item.name || 'Uncategorized',
                icon: item.icon || 'HelpCircle',
                total: parseFloat(item.total)
            })),
            weeklyActivity: weeklyActivity.map((item) => ({
                date: new Date(item.date).toLocaleDateString('vi-VN', { weekday: 'short' }),
                count: parseInt(item.count, 10)
            }))
        }, 'ADMIN_ANALYTICS_LOADED');
    } catch (err) {
        console.error('Admin analytics error:', err);
        sendError(res, 'ADMIN_ANALYTICS_FAILED', 500);
    }
};

exports.listUsers = async (req, res) => {
    try {
        const { page = 1, limit = 20, search, role, status } = req.query;
        const pageNumber = parseInt(page, 10);
        const perPage = parseInt(limit, 10);
        const offset = (pageNumber - 1) * perPage;

        const where = buildSearchWhere(search);
        // Các bộ lọc này đến từ giao diện: vai trò và trạng thái khóa tài khoản.
        if (role && role !== 'all') where.role = role;
        if (status && status !== 'all') {
            where.is_locked = status === 'locked';
        }

        const { count, rows } = await User.findAndCountAll({
            where,
            offset,
            limit: perPage,
            // Không trả password_hash ra frontend dù admin đang xem danh sách user.
            attributes: { exclude: ['password_hash'] },
            order: [['createdAt', 'DESC']]
        });

        success(res, {
            users: rows,
            total: count,
            page: pageNumber,
            totalPages: Math.ceil(count / perPage)
        }, 'ADMIN_USERS_LOADED');
    } catch (err) {
        console.error('Admin listUsers error:', err);
        sendError(res, 'ADMIN_USERS_FAILED', 500);
    }
};

exports.getUserDetail = async (req, res) => {
    try {
        // include giúp admin xem nhanh ví và gia đình liên quan đến user trước khi thao tác.
        const user = await User.findByPk(req.params.id, {
            attributes: { exclude: ['password_hash'] },
            include: [
                { model: Wallet, attributes: ['id', 'name', 'balance', 'currency'] },
                { model: Family, as: 'Families', attributes: ['id', 'name'], through: { attributes: [] } }
            ]
        });

        if (!user) {
            return sendError(res, 'USER_NOT_FOUND', 404);
        }

        const transactionCount = await Transaction.count({ where: { user_id: user.id } });
        success(res, { ...user.toJSON(), transactionCount }, 'ADMIN_USER_DETAIL_LOADED');
    } catch (err) {
        console.error('Admin getUserDetail error:', err);
        sendError(res, 'ADMIN_USER_DETAIL_FAILED', 500);
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return sendError(res, 'USER_NOT_FOUND', 404);
        // Chặn admin tự xóa chính mình để tránh mất tài khoản quản trị cuối cùng đang dùng.
        if (user.id === req.user.id) return sendError(res, 'CANNOT_DELETE_SELF', 400);

        await user.destroy();
        success(res, null, 'USER_DELETED');
    } catch (err) {
        console.error('Admin deleteUser error:', err);
        sendError(res, 'USER_DELETE_FAILED', 500);
    }
};

exports.toggleLock = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id, {
            attributes: { exclude: ['password_hash'] }
        });
        if (!user) return sendError(res, 'USER_NOT_FOUND', 404);
        // Chặn admin tự khóa tài khoản hiện tại.
        if (user.id === req.user.id) return sendError(res, 'CANNOT_LOCK_SELF', 400);

        // Đảo trạng thái: đang mở thì khóa, đang khóa thì mở lại.
        user.is_locked = !user.is_locked;
        await user.save();
        success(res, { user }, user.is_locked ? 'USER_LOCKED' : 'USER_UNLOCKED');
    } catch (err) {
        console.error('Admin toggleLock error:', err);
        sendError(res, 'TOGGLE_LOCK_FAILED', 500);
    }
};

exports.changeRole = async (req, res) => {
    try {
        const { role } = req.body;
        // Chỉ cho phép ba vai trò hệ thống đang hỗ trợ.
        if (!['member', 'staff', 'admin'].includes(role)) {
            return sendError(res, 'INVALID_ROLE', 400);
        }

        const user = await User.findByPk(req.params.id, {
            attributes: { exclude: ['password_hash'] }
        });
        if (!user) return sendError(res, 'USER_NOT_FOUND', 404);
        // Chặn admin tự đổi quyền của mình để tránh tự mất quyền quản trị.
        if (user.id === req.user.id) return sendError(res, 'CANNOT_CHANGE_OWN_ROLE', 400);

        user.role = role;
        await user.save();
        success(res, { user }, 'ROLE_CHANGED');
    } catch (err) {
        console.error('Admin changeRole error:', err);
        sendError(res, 'ROLE_CHANGE_FAILED', 500);
    }
};

exports.getLogs = async (req, res) => {
    const { AuditLog } = require('../models');
    try {
        const { page = 1, limit = 50, action } = req.query;
        const pageNumber = parseInt(page, 10);
        const perPage = parseInt(limit, 10);
        const offset = (pageNumber - 1) * perPage;
        // action=ALL nghĩa là xem toàn bộ; action cụ thể dùng để lọc nhật ký.
        const where = action && action !== 'ALL' ? { action } : {};

        const { count, rows } = await AuditLog.findAndCountAll({
            where,
            offset,
            limit: perPage,
            order: [['createdAt', 'DESC']],
            include: [{ model: User, attributes: ['id', 'name', 'email'] }]
        });

        success(res, {
            logs: rows,
            total: count,
            page: pageNumber,
            totalPages: Math.ceil(count / perPage)
        }, 'ADMIN_LOGS_LOADED');
    } catch (err) {
        console.error('Admin getLogs error:', err);
        sendError(res, 'ADMIN_LOGS_FAILED', 500);
    }
};

exports.getFinancialOverview = async (req, res) => {
    try {
        // Tổng số dư hệ thống được tính từ toàn bộ ví.
        const systemBalance = parseFloat(await Wallet.sum('balance')) || 0;

        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);
        sixMonthsAgo.setHours(0, 0, 0, 0);

        const isSqlite = sequelize?.getDialect && sequelize.getDialect() === 'sqlite';
        const dateTruncFn = isSqlite
            ? 'strftime(\'%Y-%m-01T00:00:00.000Z\', "date")'
            : 'DATE_TRUNC(\'month\', "date")';

        const revenueTrendsRaw = await sequelize.query(`
            SELECT
                ${dateTruncFn} AS month,
                type,
                SUM("amount") AS total
            FROM "Transactions"
            WHERE "date" >= :sixMonthsAgo AND "type" IN ('INCOME', 'EXPENSE')
            GROUP BY ${dateTruncFn}, type
            ORDER BY month ASC
        `, {
            // replacements giúp truyền tham số an toàn thay vì ghép chuỗi trực tiếp.
            replacements: { sixMonthsAgo },
            type: sequelize.QueryTypes.SELECT
        });

        const trendsMap = {};
        for (let index = 0; index < 6; index += 1) {
            const date = new Date(sixMonthsAgo);
            date.setMonth(date.getMonth() + index);
            const monthKey = date.toISOString().slice(0, 7);
            trendsMap[monthKey] = {
                month: new Date(date).toLocaleDateString('vi-VN', { month: 'short', year: '2-digit' }),
                income: 0,
                expense: 0
            };
        }

        revenueTrendsRaw.forEach((item) => {
            const monthKey = new Date(item.month).toISOString().slice(0, 7);
            if (!trendsMap[monthKey]) {
                return;
            }
            const trendKey = item.type === 'INCOME' ? 'income' : 'expense';
            trendsMap[monthKey][trendKey] = parseFloat(item.total) || 0;
        });

        const revenueTrends = Object.values(trendsMap);

        const topSpendersRaw = await sequelize.query(`
            SELECT u.id, u.name, u.email, SUM(CAST(t.amount AS numeric)) as total_spent
            FROM "Users" u
            JOIN "Transactions" t ON u.id = t.user_id AND t.type = 'EXPENSE'
            GROUP BY u.id
            ORDER BY total_spent DESC
            LIMIT 5
        `, { type: sequelize.QueryTypes.SELECT });

        const topSpenders = topSpendersRaw.map((item) => ({
            ...item,
            total_spent: parseFloat(item.total_spent) || 0
        }));

        const budgets = await Budget.findAll();
        let overBudgetCount = 0;

        for (const budget of budgets) {
            // Tính từng ngân sách có vượt hạn mức hay không để ra tỷ lệ tuân thủ ngân sách.
            const spent = await Transaction.sum('amount', {
                where: {
                    category_id: budget.category_id,
                    type: 'EXPENSE',
                    date: { [Op.gte]: budget.start_date, [Op.lte]: budget.end_date }
                }
            });

            if ((spent || 0) > Number(budget.amount_limit || 0)) {
                overBudgetCount += 1;
            }
        }

        const budgetCompliance = budgets.length > 0
            ? Math.round(((budgets.length - overBudgetCount) / budgets.length) * 100)
            : 100;

        success(res, {
            systemBalance,
            revenueTrends,
            topSpenders,
            budgetCompliance
        }, 'ADMIN_FINANCIAL_LOADED');
    } catch (err) {
        console.error('Admin getFinancialOverview error:', err);
        sendError(res, 'ADMIN_FINANCIAL_FAILED', 500);
    }
};
