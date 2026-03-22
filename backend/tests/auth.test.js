process.env.JWT_SECRET = 'test-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh';
const request = require('supertest');
const express = require('express');
const { Sequelize } = require('sequelize');

// Mock uuid (ESM) and uploadMiddleware to avoid parser issues in Jest CJS environment
jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mocked-uuid')
}));
jest.mock('../middleware/uploadMiddleware', () => ({
    uploadAvatar: { single: () => (req, res, next) => next() }
}));
jest.mock('../middleware/auditMiddleware', () => () => (req, res, next) => next());

// Mock Data
// Setup In-Memory DB
const mockSequelize = new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false });

const mockUser = mockSequelize.define('User', {
    id: { type: require('sequelize').DataTypes.UUID, defaultValue: require('sequelize').DataTypes.UUIDV4, primaryKey: true },
    name: { type: require('sequelize').DataTypes.STRING, allowNull: false },
    email: { type: require('sequelize').DataTypes.STRING, allowNull: false, unique: true },
    password_hash: { type: require('sequelize').DataTypes.STRING, allowNull: false },
    role: { type: require('sequelize').DataTypes.ENUM('admin', 'member'), defaultValue: 'member' },
    status: { type: require('sequelize').DataTypes.ENUM('active', 'locked'), defaultValue: 'active' }
});

// We don't need real AuditLogs for Auth tests here, just mock it or don't use the middleware that requires it
jest.mock('../models', () => ({
    User: mockUser,
    Wallet: {},
    Family: { create: jest.fn().mockResolvedValue({ id: 'dummy-family' }) },
    FamilyMember: { create: jest.fn().mockResolvedValue({ id: 'dummy-member' }) },
    Transaction: {},
    Category: {},
    Budget: {},
    Goal: {},
    AuditLog: { create: jest.fn() },
    sequelize: mockSequelize
}));

let app;

beforeAll(async () => {
    await mockSequelize.sync({ force: true });

    const authRoutes = require('../routes/authRoutes');
    const responseMiddleware = require('../middleware/responseMiddleware');
    app = express();
    app.use(express.json());
    app.use(responseMiddleware);
    app.use('/api/auth', authRoutes);
});

afterAll(async () => {
    await mockSequelize.close();
});

describe('Auth API Endpoints', () => {
    it('should register a new user successfully', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Test User',
                email: 'testauth@example.com',
                password: 'password123'
            });

        expect([200, 201]).toContain(res.statusCode);
        expect(res.body).toHaveProperty('data');
        expect(res.body.data.user.email).toEqual('testauth@example.com');
    });

    it('should fail registration with existing email', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Duplicate',
                email: 'testauth@example.com',
                password: 'password123'
            });

        expect(res.statusCode).toEqual(400);
        expect(res.body).toHaveProperty('message');
    });
    
    it('should login an existing user', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'testauth@example.com',
                password: 'password123'
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body.data).toHaveProperty('token');
        expect(res.body.data.user.email).toEqual('testauth@example.com');
    });

    it('should fail login with wrong password', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'testauth@example.com',
                password: 'wrongpassword'
            });

        expect(res.statusCode).toEqual(400);
    });
});

describe('Auth Validation (Input Rules)', () => {
    it('should reject register with invalid email format', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Bad Email User',
                email: 'not-an-email',
                password: 'password123'
            });

        expect([400, 422]).toContain(res.statusCode);
    });

    it('should reject register with password shorter than 6 characters', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Short Pass User',
                email: 'shortpass@example.com',
                password: '123'
            });

        expect([400, 422]).toContain(res.statusCode);
    });

    it('should reject register when required fields are missing', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ email: 'onlyemail@example.com' });

        expect([400, 422]).toContain(res.statusCode);
    });
});
