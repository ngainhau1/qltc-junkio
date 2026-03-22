const request = require('supertest');
const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

// Mock middlewares
jest.mock('../middleware/authMiddleware', () => (req, res, next) => {
    // Only mock valid user for happy paths
    // For specific tests we might need to bypass or customize this, 
    // but typically we assume the user is valid if authMiddleware passes
    req.user = { id: 'user-id-mock', email: 'test@examples.com', role: 'USER' };
    next();
});

// Setup mock DB & model
const mockSequelize = new Sequelize('sqlite::memory:', { logging: false });

const mockUser = mockSequelize.define('User', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING },
    email: { type: DataTypes.STRING, unique: true },
    password_hash: { type: DataTypes.STRING },
    avatar: { type: DataTypes.STRING },
    role: { type: DataTypes.STRING, defaultValue: 'USER' },
    status: { type: DataTypes.STRING, defaultValue: 'ACTIVE' }
});

jest.mock('../models/index', () => ({
    sequelize: mockSequelize,
    User: mockUser
}));
jest.mock('../models', () => ({
    sequelize: mockSequelize,
    User: mockUser
}));

const userRoutes = require('../routes/userRoutes');

const app = express();
app.use(express.json());
app.use('/api/users', userRoutes);

describe('User API Endpoints', () => {
    let testUserId;
    let originalPassword = 'Password123!';

    beforeAll(async () => {
        await mockSequelize.sync({ force: true });

        const salt = await bcrypt.genSalt(10);
        const pwdHash = await bcrypt.hash(originalPassword, salt);

        // 'user-id-mock' needs to exist in DB for findByPk to work
        const user = await mockUser.create({
            id: 'user-id-mock', // explicitly match mock authMiddleware
            name: 'Original Name',
            email: 'test@examples.com',
            password_hash: pwdHash,
            role: 'USER'
        });
        testUserId = user.id;
    });

    afterAll(async () => {
        await mockSequelize.close();
    });

    describe('GET /api/users/me', () => {
        it('should get current user profile', async () => {
            const res = await request(app).get('/api/users/me');
            expect(res.statusCode).toEqual(200);
            expect(res.body.message).toMatch(/Lấy thông tin người dùng thành công/);
            expect(res.body.data.id).toEqual(testUserId);
            expect(res.body.data.name).toEqual('Original Name');
            expect(res.body.data.email).toEqual('test@examples.com');
            // Password hash must be omitted
            expect(res.body.data.password_hash).toBeUndefined();
        });
    });

    describe('PUT /api/users/me', () => {
        it('should update user profile successfully', async () => {
            const res = await request(app).put('/api/users/me').send({
                name: 'Updated Name'
            });
            expect(res.statusCode).toEqual(200);
            expect(res.body.message).toMatch(/Cập nhật thông tin thành công/);
            expect(res.body.data.name).toEqual('Updated Name');
            
            // Check DB
            const userInDb = await mockUser.findByPk(testUserId);
            expect(userInDb.name).toEqual('Updated Name');
        });

        it('should return 422 for invalid name length', async () => {
            // Validator checks for 1-100 characters max
            const res = await request(app).put('/api/users/me').send({
                name: '' // empty name
            });
            expect(res.statusCode).toEqual(422);
            expect(res.body.errors[0].msg).toMatch(/Tên phải từ 1-100 ký tự/);
        });
    });

    describe('PUT /api/users/me/password', () => {
        it('should change password with correct current password', async () => {
            const res = await request(app).put('/api/users/me/password').send({
                currentPassword: originalPassword,
                newPassword: 'NewSecurePassword123!'
            });
            expect(res.statusCode).toEqual(200);
            expect(res.body.message).toMatch(/Đổi mật khẩu thành công/);

            // Fetch DB and verify hash
            const userInDb = await mockUser.findByPk(testUserId);
            const isMatch = await bcrypt.compare('NewSecurePassword123!', userInDb.password_hash);
            expect(isMatch).toBeTruthy();
        });

        it('should return 400 with incorrect current password', async () => {
            const res = await request(app).put('/api/users/me/password').send({
                currentPassword: 'WrongPassword666',
                newPassword: 'AnotherPassword444'
            });
            expect(res.statusCode).toEqual(400);
            expect(res.body.message).toMatch(/Mật khẩu hiện tại không đúng/);
        });

        it('should return 422 for short new password via validator', async () => {
            const res = await request(app).put('/api/users/me/password').send({
                currentPassword: 'NewSecurePassword123!',
                newPassword: '123' // too short
            });
            // Validation kicks in from userValidator.js -> 422 Unprocessable Entity
            expect(res.statusCode).toEqual(422);
            expect(res.body.errors[0].msg).toMatch(/Mật khẩu mới phải có ít nhất 6 ký tự/);
        });
    });
});
