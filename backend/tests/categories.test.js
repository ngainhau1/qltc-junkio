const request = require('supertest');
const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');

// Mock uuid
jest.mock('uuid', () => {
    const crypto = require('crypto');
    return {
        v4: () => crypto.randomUUID()
    };
});

// Mock authMiddleware (Category endpoints don't strictly require user matching ownership right now per controller, but typical flow has auth)
jest.mock('../middleware/authMiddleware', () => (req, res, next) => {
    req.user = { id: 'user-1', email: 'test@example.com', role: 'USER' };
    next();
});

// Mock models
const mockSequelize = new Sequelize('sqlite::memory:', { logging: false });

const mockCategory = mockSequelize.define('Category', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    type: { type: DataTypes.ENUM('INCOME', 'EXPENSE'), allowNull: false },
    icon: { type: DataTypes.STRING, defaultValue: 'Circle' },
    parent_id: { type: DataTypes.UUID, allowNull: true }
}, { timestamps: true });

jest.mock('../models', () => ({
    sequelize: mockSequelize,
    Category: mockCategory
}));

const categoryRoutes = require('../routes/categoryRoutes');

const app = express();
app.use(express.json());
app.use('/api/categories', categoryRoutes);

describe('Category API Endpoints', () => {
    beforeAll(async () => {
        await mockSequelize.sync({ force: true });
        
        // Seed categories
        await mockCategory.create({ name: 'Food', type: 'EXPENSE', icon: 'FastFood' });
        await mockCategory.create({ name: 'Salary', type: 'INCOME', icon: 'Money' });
    });

    afterAll(async () => {
        await mockSequelize.close();
    });

    describe('GET /api/categories', () => {
        it('should return 200 and list all categories', async () => {
            const res = await request(app).get('/api/categories');
            expect(res.statusCode).toEqual(200);
            expect(res.body.data).toBeInstanceOf(Array);
            expect(res.body.data.length).toBeGreaterThanOrEqual(2);
        });
    });

    describe('POST /api/categories', () => {
        it('should create a new category successfully', async () => {
            const res = await request(app).post('/api/categories').send({
                name: 'Transport',
                type: 'EXPENSE',
                icon: 'Car'
            });
            expect(res.statusCode).toEqual(201);
            expect(res.body.data.name).toEqual('Transport');
            expect(res.body.data.type).toEqual('EXPENSE');
        });

        it('should return 422 for invalid category type', async () => {
            const res = await request(app).post('/api/categories').send({
                name: 'Invalid Type Category',
                type: 'INVALID'
            });
            expect(res.statusCode).toEqual(422);
            expect(res.body.errors[0].msg).toMatch(/Loại phải là INCOME hoặc EXPENSE/);
        });
    });

    describe('PUT /api/categories/:id', () => {
        let testCategoryId;

        beforeAll(async () => {
            const cat = await mockCategory.create({ name: 'Entertainment', type: 'EXPENSE' });
            testCategoryId = cat.id;
        });

        it('should update category details', async () => {
            const res = await request(app).put(`/api/categories/${testCategoryId}`).send({
                name: 'Fun',
                icon: 'Smile'
            });
            expect(res.statusCode).toEqual(200);
            expect(res.body.data.name).toEqual('Fun');
            expect(res.body.data.icon).toEqual('Smile');
        });

        it('should return 404 for a non-existent category', async () => {
            const crypto = require('crypto');
            const res = await request(app).put(`/api/categories/${crypto.randomUUID()}`).send({
                name: 'Missing'
            });
            expect(res.statusCode).toEqual(404);
            expect(res.body.message).toMatch(/Danh mục không tồn tại/);
        });

        it('should return 422 for an invalid UUID format', async () => {
            const res = await request(app).put('/api/categories/not-a-uuid').send({
                name: 'Invalid ID'
            });
            expect(res.statusCode).toEqual(422);
        });
    });

    describe('DELETE /api/categories/:id', () => {
        let deleteCategoryId;

        beforeAll(async () => {
            const cat = await mockCategory.create({ name: 'To Be Deleted', type: 'INCOME' });
            deleteCategoryId = cat.id;
        });

        it('should return 404 if category does not exist', async () => {
            const crypto = require('crypto');
            const fakeId = crypto.randomUUID();
            const res = await request(app).delete(`/api/categories/${fakeId}`);
            expect(res.statusCode).toEqual(404);
        });

        it('should delete category successfully', async () => {
            const res = await request(app).delete(`/api/categories/${deleteCategoryId}`);
            expect(res.statusCode).toEqual(200);
            expect(res.body.message).toMatch(/Đã xóa danh mục thành công/);
            
            // Verify deleted
            const checkRes = await request(app).delete(`/api/categories/${deleteCategoryId}`);
            expect(checkRes.statusCode).toEqual(404);
        });
    });
});
