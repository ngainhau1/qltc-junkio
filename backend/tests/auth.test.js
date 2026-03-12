const request = require('supertest');
const express = require('express');
const { Sequelize } = require('sequelize');
const authRoutes = require('../routes/authRoutes');

// Mock uuid to avoid ES Module import issues in Jest
jest.mock('uuid', () => ({
    v4: () => 'mocked-uuid'
}));

// Mock Data
let app;
let sequelize;
let User;

beforeAll(async () => {
    // Setup In-Memory DB
    sequelize = new Sequelize('sqlite::memory:', { logging: false });
    
    User = sequelize.define('User', {
        id: { type: require('sequelize').DataTypes.UUID, defaultValue: require('sequelize').DataTypes.UUIDV4, primaryKey: true },
        name: { type: require('sequelize').DataTypes.STRING, allowNull: false },
        email: { type: require('sequelize').DataTypes.STRING, allowNull: false, unique: true },
        password: { type: require('sequelize').DataTypes.STRING, allowNull: false },
        role: { type: require('sequelize').DataTypes.ENUM('admin', 'member'), defaultValue: 'member' },
        status: { type: require('sequelize').DataTypes.ENUM('active', 'locked'), defaultValue: 'active' }
    });

    // We don't need real AuditLogs for Auth tests here, just mock it or don't use the middleware that requires it
    jest.mock('../models', () => ({
        User,
        Wallet: {},
        Family: {},
        Transaction: {},
        Category: {},
        Budget: {},
        Goal: {},
        AuditLog: { create: jest.fn() },
        sequelize
    }));

    await sequelize.sync({ force: true });

    app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);
});

afterAll(async () => {
    await sequelize.close();
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

        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('user');
        expect(res.body.user.email).toEqual('testauth@example.com');
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
        expect(res.body).toHaveProperty('accessToken');
        expect(res.body.user.email).toEqual('testauth@example.com');
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
