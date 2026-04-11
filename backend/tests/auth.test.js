process.env.JWT_SECRET = 'test-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh';
const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const { Sequelize } = require('sequelize');
const { DataTypes } = require('sequelize');

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mocked-uuid')
}));

jest.mock('../middleware/uploadMiddleware', () => ({
    uploadAvatar: { single: () => (req, res, next) => next() }
}));

jest.mock('../middleware/auditMiddleware', () => () => (req, res, next) => next());
jest.mock('../services/emailService', () => jest.fn());

const sendEmail = require('../services/emailService');

const mockSequelize = new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false });

const mockUser = mockSequelize.define('User', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password_hash: { type: DataTypes.STRING, allowNull: false },
    reset_password_token: { type: DataTypes.STRING, allowNull: true },
    reset_password_expires: { type: DataTypes.DATE, allowNull: true },
    role: { type: DataTypes.ENUM('admin', 'member', 'staff'), defaultValue: 'member' },
    avatar: { type: DataTypes.STRING, allowNull: true },
    is_locked: { type: DataTypes.BOOLEAN, defaultValue: false }
});

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
    app.use(cookieParser());
    app.use(responseMiddleware);
    app.use('/api/auth', authRoutes);
});

afterAll(async () => {
    await mockSequelize.close();
});

describe('Auth API Endpoints', () => {
    it('registers a new user successfully', async () => {
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
        expect(res.body.data.user.role).toEqual('member');
    });

    it('fails registration with existing email using 409', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Duplicate',
                email: 'testauth@example.com',
                password: 'password123'
            });

        expect(res.statusCode).toEqual(409);
        expect(res.body.message).toEqual('EMAIL_IN_USE');
    });

    it('logs in an existing user', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'testauth@example.com',
                password: 'password123'
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body.data).toHaveProperty('token');
        expect(res.body.data.user.email).toEqual('testauth@example.com');
        expect(res.body.data.user.role).toEqual('member');
        expect(res.headers['set-cookie']).toBeDefined();
    });

    it('fails login with wrong password', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'testauth@example.com',
                password: 'wrongpassword'
            });

        expect(res.statusCode).toEqual(400);
        expect(res.body.message).toEqual('INVALID_CREDENTIALS');
    });

    it('supports /auth/me as compatibility alias', async () => {
        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'testauth@example.com',
                password: 'password123'
            });

        const profileRes = await request(app)
            .get('/api/auth/me')
            .set('Authorization', `Bearer ${loginRes.body.data.token}`);

        expect(profileRes.statusCode).toEqual(200);
        expect(profileRes.body.data.email).toEqual('testauth@example.com');
        expect(profileRes.body.data.role).toEqual('member');
    });

    it('refreshes access token while preserving role', async () => {
        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'testauth@example.com',
                password: 'password123'
            });

        const cookies = loginRes.headers['set-cookie'];
        const refreshRes = await request(app)
            .post('/api/auth/refresh-token')
            .set('Cookie', cookies);

        expect(refreshRes.statusCode).toEqual(200);
        expect(refreshRes.body.data.user.role).toEqual('member');

        const decoded = jwt.verify(refreshRes.body.data.token, process.env.JWT_SECRET);
        expect(decoded.user.id).toBeDefined();
        expect(decoded.user.role).toEqual('member');
    });

    it('logs out and clears refresh cookie', async () => {
        const res = await request(app).post('/api/auth/logout');
        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toEqual('LOGOUT_SUCCESS');
    });

    it('completes forgot/reset password and clears the reset token', async () => {
        sendEmail.mockResolvedValueOnce(undefined);

        const resetUser = await mockUser.create({
            id: '44444444-4444-4444-8444-444444444444',
            name: 'Reset User',
            email: 'reset@example.com',
            password_hash: await bcrypt.hash('oldpassword123', 10),
            role: 'member'
        });

        const forgotRes = await request(app)
            .post('/api/auth/forgot-password')
            .send({ email: resetUser.email });

        expect(forgotRes.statusCode).toEqual(200);
        expect(sendEmail).toHaveBeenCalledTimes(1);

        const persistedAfterForgot = await mockUser.findByPk(resetUser.id);
        expect(persistedAfterForgot.reset_password_token).toBeTruthy();
        expect(persistedAfterForgot.reset_password_expires).toBeTruthy();

        const tokenMatch = sendEmail.mock.calls[0][0].message.match(/\/reset-password\/([a-f0-9]+)/i);
        expect(tokenMatch).toBeTruthy();
        const plainToken = tokenMatch[1];

        const resetRes = await request(app)
            .post(`/api/auth/reset-password/${plainToken}`)
            .send({ password: 'newpassword123' });

        expect(resetRes.statusCode).toEqual(200);
        expect(resetRes.body.message).toEqual('RESET_PASSWORD_SUCCESS');

        const persistedAfterReset = await mockUser.findByPk(resetUser.id);
        expect(persistedAfterReset.reset_password_token).toBeNull();
        expect(persistedAfterReset.reset_password_expires).toBeNull();

        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({
                email: resetUser.email,
                password: 'newpassword123'
            });

        expect(loginRes.statusCode).toEqual(200);
        expect(loginRes.body.data.user.email).toEqual(resetUser.email);
    });
});

describe('Auth Validation (Input Rules)', () => {
    it('rejects register with invalid email format', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Bad Email User',
                email: 'not-an-email',
                password: 'password123'
            });

        expect([400, 422]).toContain(res.statusCode);
    });

    it('rejects register with password shorter than 6 characters', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Short Pass User',
                email: 'shortpass@example.com',
                password: '123'
            });

        expect([400, 422]).toContain(res.statusCode);
    });

    it('rejects register when required fields are missing', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ email: 'onlyemail@example.com' });

        expect([400, 422]).toContain(res.statusCode);
    });
});
