const request = require('supertest');
const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');

const mockSequelize = new Sequelize('sqlite::memory:', { logging: false });

const mockNotification = mockSequelize.define('Notification', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    user_id: { type: DataTypes.UUID },
    type: { type: DataTypes.STRING },
    title: { type: DataTypes.STRING },
    message: { type: DataTypes.STRING },
    isRead: { type: DataTypes.BOOLEAN, defaultValue: false },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
});

const mockUser = mockSequelize.define('User', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING }
});

jest.mock('../models', () => ({
    Notification: mockNotification,
    User: mockUser
}));

jest.mock('../config/socket', () => ({
    getIO: () => ({
        to: () => ({
            emit: jest.fn()
        })
    })
}));

let mockUserRole = 'USER';
let mockUserId;
jest.mock('../middleware/authMiddleware', () => (req, res, next) => {
    req.user = { id: mockUserId, role: mockUserRole };
    next();
});

const notificationRoutes = require('../routes/notificationRoutes');

const app = express();
app.use(express.json());
app.use('/api/notifications', notificationRoutes);

describe('Notification API Endpoints', () => {
    let regularUserId, adminUserId;

    beforeAll(async () => {
        await mockSequelize.sync({ force: true });
        const crypto = require('crypto');

        regularUserId = crypto.randomUUID();
        adminUserId = crypto.randomUUID();

        await mockUser.create({ id: regularUserId, name: 'Regular User' });
        await mockUser.create({ id: adminUserId, name: 'Admin User' });

        await mockNotification.create({
            user_id: regularUserId,
            title: 'Test Notif 1',
            message: 'Message 1',
            isRead: false
        });

        await mockNotification.create({
            user_id: regularUserId,
            title: 'Test Notif 2',
            message: 'Message 2',
            isRead: true
        });
    });

    afterAll(async () => {
        await mockSequelize.close();
    });

    describe('GET /api/notifications', () => {
        it('should get all notifications of the user', async () => {
            mockUserId = regularUserId;
            const res = await request(app).get('/api/notifications');
            expect(res.statusCode).toEqual(200);
            expect(res.body.data.length).toBe(2);
        });
    });

    describe('PUT /api/notifications/read-all', () => {
        it('should mark all notifications as read', async () => {
            mockUserId = regularUserId;
            const res = await request(app).put('/api/notifications/read-all');
            expect(res.statusCode).toEqual(200);

            const unreadCount = await mockNotification.count({ where: { user_id: regularUserId, isRead: false } });
            expect(unreadCount).toBe(0);
        });
    });

    describe('PUT /api/notifications/:id/read', () => {
        it('should return 404 for wrong notification', async () => {
            mockUserId = regularUserId;
            const crypto = require('crypto');
            const res = await request(app).put(`/api/notifications/${crypto.randomUUID()}/read`);
            expect(res.statusCode).toEqual(404);
            expect(res.body.message).toBe('NOTIFICATION_NOT_FOUND');
        });

        it('should mark single notification as read', async () => {
            mockUserId = regularUserId;
            const n3 = await mockNotification.create({
                user_id: regularUserId,
                title: 'Test Notif 3',
                message: 'Message 3',
                isRead: false
            });

            const res = await request(app).put(`/api/notifications/${n3.id}/read`);
            expect(res.statusCode).toEqual(200);

            const updated = await mockNotification.findByPk(n3.id);
            expect(updated.isRead).toBe(true);
        });
    });

    describe('POST /api/notifications/broadcast', () => {
        it('should return 403 if user is not admin', async () => {
            mockUserId = regularUserId;
            mockUserRole = 'USER';
            const res = await request(app).post('/api/notifications/broadcast').send({
                title: 'Hello',
                message: 'Broadcast message'
            });
            expect(res.statusCode).toEqual(403);
            expect(res.body.message).toBe('FORBIDDEN');
        });

        it('should broadcast successfully when admin', async () => {
            mockUserId = adminUserId;
            mockUserRole = 'admin';
            const res = await request(app).post('/api/notifications/broadcast').send({
                title: 'Hello',
                message: 'Broadcast message'
            });
            expect(res.statusCode).toEqual(200);
            expect(res.body.message).toBe('NOTIFICATION_BROADCAST_SUCCESS');

            const count = await mockNotification.count({ where: { message: '[Hello] Broadcast message' } });
            expect(count).toBe(2);
        });
    });
});
