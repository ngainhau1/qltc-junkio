const { User, Transaction, Wallet, Family } = require('../models');
const { Op } = require('sequelize');

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
        res.json({ totalUsers, totalTransactions, totalFamilies, recentUsers });
    } catch (error) {
        console.error('Admin dashboard error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// GET /api/admin/users?page=1&limit=20&search=keyword
exports.listUsers = async (req, res) => {
    try {
        const { page = 1, limit = 20, search } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const where = search ? {
            [Op.or]: [
                { name: { [Op.iLike]: `%${search}%` } },
                { email: { [Op.iLike]: `%${search}%` } }
            ]
        } : {};
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
