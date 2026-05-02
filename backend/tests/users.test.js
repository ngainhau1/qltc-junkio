const request = require('supertest');
const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

jest.mock('../middleware/authMiddleware', () => (req, res, next) => {
    req.user = { id: 'user-id-mock', email: 'test@examples.com', role: 'USER' };
    next();
});

const mockSequelize = new Sequelize('sqlite::memory:', { logging: false });

const mockUser = mockSequelize.define('User', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING },
    email: { type: DataTypes.STRING, unique: true },
    password_hash: { type: DataTypes.STRING },
    avatar: { type: DataTypes.STRING },
    phone: { type: DataTypes.STRING(32), allowNull: true },
    dateOfBirth: { type: DataTypes.DATEONLY, allowNull: true, field: 'date_of_birth' },
    role: { type: DataTypes.STRING, defaultValue: 'USER' },
    status: { type: DataTypes.STRING, defaultValue: 'ACTIVE' },
});

jest.mock('../models/index', () => ({
    sequelize: mockSequelize,
    User: mockUser,
}));
jest.mock('../models', () => ({
    sequelize: mockSequelize,
    User: mockUser,
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
        const passwordHash = await bcrypt.hash(originalPassword, salt);

        const user = await mockUser.create({
            id: 'user-id-mock',
            name: 'Original Name',
            email: 'test@examples.com',
            password_hash: passwordHash,
            role: 'USER',
            phone: '0912345678',
            dateOfBirth: '1995-05-20',
        });
        testUserId = user.id;
    });

    afterAll(async () => {
        await mockSequelize.close();
    });

    describe('GET /api/users/me', () => {
        it('gets current user profile', async () => {
            const res = await request(app).get('/api/users/me');

            expect(res.statusCode).toEqual(200);
            expect(res.body.message).toEqual('PROFILE_FETCH_SUCCESS');
            expect(res.body.data.id).toEqual(testUserId);
            expect(res.body.data.name).toEqual('Original Name');
            expect(res.body.data.email).toEqual('test@examples.com');
            expect(res.body.data.phone).toEqual('0912345678');
            expect(res.body.data.dateOfBirth).toEqual('1995-05-20');
            expect(res.body.data.password_hash).toBeUndefined();
        });
    });

    describe('PUT /api/users/me', () => {
        it('updates user profile successfully', async () => {
            const res = await request(app).put('/api/users/me').send({
                name: 'Updated Name',
                phone: '+84 912 345 678',
                dateOfBirth: '1996-06-21',
            });

            expect(res.statusCode).toEqual(200);
            expect(res.body.message).toEqual('PROFILE_UPDATE_SUCCESS');
            expect(res.body.data.name).toEqual('Updated Name');
            expect(res.body.data.phone).toEqual('+84 912 345 678');
            expect(res.body.data.dateOfBirth).toEqual('1996-06-21');

            const userInDb = await mockUser.findByPk(testUserId);
            expect(userInDb.name).toEqual('Updated Name');
            expect(userInDb.phone).toEqual('+84 912 345 678');
            expect(userInDb.dateOfBirth).toEqual('1996-06-21');
        });

        it('clears optional profile fields with empty strings', async () => {
            const res = await request(app).put('/api/users/me').send({
                phone: '',
                dateOfBirth: '',
            });

            expect(res.statusCode).toEqual(200);
            expect(res.body.data.phone).toBeNull();
            expect(res.body.data.dateOfBirth).toBeNull();

            const userInDb = await mockUser.findByPk(testUserId);
            expect(userInDb.phone).toBeNull();
            expect(userInDb.dateOfBirth).toBeNull();
        });

        it('returns 422 for invalid phone format', async () => {
            const res = await request(app).put('/api/users/me').send({
                phone: '09abc123',
            });

            expect(res.statusCode).toEqual(422);
            expect(res.body.message).toEqual('VALIDATION_FAILED');
            expect(res.body.errors[0]).toEqual(
                expect.objectContaining({
                    field: 'phone',
                    code: 'VALIDATION_PHONE_INVALID_FORMAT',
                })
            );
        });

        it('returns 422 for a future date of birth', async () => {
            const futureYear = new Date().getFullYear() + 1;
            const res = await request(app).put('/api/users/me').send({
                dateOfBirth: `${futureYear}-01-01`,
            });

            expect(res.statusCode).toEqual(422);
            expect(res.body.message).toEqual('VALIDATION_FAILED');
            expect(res.body.errors[0]).toEqual(
                expect.objectContaining({
                    field: 'dateOfBirth',
                    code: 'VALIDATION_DATE_OF_BIRTH_MUST_NOT_BE_FUTURE',
                })
            );
        });

        it('returns 422 for an empty name', async () => {
            const res = await request(app).put('/api/users/me').send({
                name: '',
            });

            expect(res.statusCode).toEqual(422);
            expect(res.body.message).toEqual('VALIDATION_FAILED');
            expect(res.body.errors[0]).toEqual(
                expect.objectContaining({
                    field: 'name',
                    code: 'VALIDATION_NAME_REQUIRED',
                })
            );
        });
    });

    describe('PUT /api/users/me/password', () => {
        it('changes password with correct current password', async () => {
            const res = await request(app).put('/api/users/me/password').send({
                currentPassword: originalPassword,
                newPassword: 'NewSecurePassword123!',
            });

            expect(res.statusCode).toEqual(200);
            expect(res.body.message).toEqual('PASSWORD_CHANGE_SUCCESS');

            const userInDb = await mockUser.findByPk(testUserId);
            const isMatch = await bcrypt.compare('NewSecurePassword123!', userInDb.password_hash);
            expect(isMatch).toBeTruthy();
        });

        it('returns 400 with incorrect current password', async () => {
            const res = await request(app).put('/api/users/me/password').send({
                currentPassword: 'WrongPassword666',
                newPassword: 'AnotherPassword444',
            });

            expect(res.statusCode).toEqual(400);
            expect(res.body.message).toEqual('CURRENT_PASSWORD_INCORRECT');
        });

        it('returns 422 for short new password', async () => {
            const res = await request(app).put('/api/users/me/password').send({
                currentPassword: 'NewSecurePassword123!',
                newPassword: '123',
            });

            expect(res.statusCode).toEqual(422);
            expect(res.body.message).toEqual('VALIDATION_FAILED');
            expect(res.body.errors[0]).toEqual(
                expect.objectContaining({
                    field: 'newPassword',
                    code: 'VALIDATION_NEW_PASSWORD_MIN_LENGTH_NOT_MET',
                })
            );
        });
    });
});
