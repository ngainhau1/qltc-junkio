const request = require('supertest');
const express = require('express');
const { Sequelize, DataTypes, Op } = require('sequelize');

// Mock uuid to avoid ES Module import issues in Jest
jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mocked-uuid')
}));

// Setup mock models
const sequelize = new Sequelize('sqlite::memory:', { logging: false });

const User = sequelize.define('User', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.ENUM('admin', 'member'), defaultValue: 'member' },
    status: { type: DataTypes.ENUM('active', 'locked'), defaultValue: 'active' }
});

const Wallet = sequelize.define('Wallet', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    balance: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
});

const Family = sequelize.define('Family', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
});

const Transaction = sequelize.define('Transaction', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    type: { type: DataTypes.ENUM('income', 'expense', 'transfer'), allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
});

const Category = sequelize.define('Category', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    type: { type: DataTypes.ENUM('income', 'expense'), allowNull: false },
});

const Goal = sequelize.define('Goal', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
});

const Budget = sequelize.define('Budget', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    start_date: { type: DataTypes.DATEONLY, allowNull: false },
    end_date: { type: DataTypes.DATEONLY, allowNull: false },
});

// Mock relationships to prevent errors in controller includes
User.hasMany(Wallet, { foreignKey: 'user_id' });
User.hasMany(Transaction, { foreignKey: 'user_id' });
User.belongsToMany(Family, { through: 'FamilyMembers', foreignKey: 'user_id' });

jest.mock('../models', () => ({
    User, Wallet, Family, Transaction, Category, Budget, Goal,
    AuditLog: { create: jest.fn() },
    sequelize,
    Sequelize: { Op: require('sequelize').Op }
}));

// Setup app with mocked auth middleware and routes
jest.mock('../middleware/authMiddleware', () => (req, res, next) => {
    req.user = { id: 'admin-id', role: 'admin' };
    next();
});

jest.mock('../middleware/roleMiddleware', () => (...roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
    next();
});

const app = express();
app.use(express.json());
app.use('/api/admin', require('../routes/adminRoutes'));

beforeAll(async () => {
    await sequelize.sync({ force: true });
    // create dummy users
    await User.create({ id: 'admin-id', name: 'Admin', email: 'admin@test.com', password: 'pwd', role: 'admin' });
    await User.create({ id: 'user-id', name: 'User 1', email: 'user@test.com', password: 'pwd', role: 'member' });
});

afterAll(async () => {
    await sequelize.close();
});

describe('Admin API Endpoints', () => {
    it('GET /api/admin/users should return paginated list of users', async () => {
        const res = await request(app).get('/api/admin/users');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('users');
        expect(res.body.users.length).toBeGreaterThan(0);
        expect(res.body).toHaveProperty('total');
    });

    it('GET /api/admin/analytics should return system stats', async () => {
        const res = await request(app).get('/api/admin/analytics');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('stats');
        expect(res.body.stats).toHaveProperty('totalUsers');
    });

    it('DELETE /api/admin/users/:id should soft delete user', async () => {
        const res = await request(app).delete('/api/admin/users/user-id');
        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toContain('Xóa người dùng thành công');
    });
});
