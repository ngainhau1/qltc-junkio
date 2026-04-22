const request = require('supertest');
const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');

jest.mock('uuid', () => {
    const crypto = require('crypto');
    return {
        v4: () => crypto.randomUUID(),
    };
});

jest.mock('../middleware/authMiddleware', () => (req, res, next) => {
    req.user = { id: 'user-1', email: 'test@example.com', role: 'USER' };
    next();
});

const mockSequelize = new Sequelize('sqlite::memory:', { logging: false });

const mockCategory = mockSequelize.define(
    'Category',
    {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        name: { type: DataTypes.STRING, allowNull: false },
        type: { type: DataTypes.ENUM('INCOME', 'EXPENSE'), allowNull: false },
        icon: { type: DataTypes.STRING, defaultValue: 'Circle' },
        parent_id: { type: DataTypes.UUID, allowNull: true },
    },
    { timestamps: true }
);

jest.mock('../models', () => ({
    sequelize: mockSequelize,
    Category: mockCategory,
}));

const categoryRoutes = require('../routes/categoryRoutes');

const app = express();
app.use(express.json());
app.use('/api/categories', categoryRoutes);

describe('Category API Endpoints', () => {
    beforeAll(async () => {
        await mockSequelize.sync({ force: true });
        await mockCategory.create({ name: 'Food', type: 'EXPENSE', icon: 'FastFood' });
        await mockCategory.create({ name: 'Salary', type: 'INCOME', icon: 'Money' });
    });

    afterAll(async () => {
        await mockSequelize.close();
    });

    describe('GET /api/categories', () => {
        it('returns all categories', async () => {
            const res = await request(app).get('/api/categories');
            expect(res.statusCode).toEqual(200);
            expect(res.body.data).toBeInstanceOf(Array);
            expect(res.body.data.length).toBeGreaterThanOrEqual(2);
        });
    });

    describe('POST /api/categories', () => {
        it('creates a new category successfully', async () => {
            const res = await request(app).post('/api/categories').send({
                name: 'Transport',
                type: 'EXPENSE',
                icon: 'Car',
            });

            expect(res.statusCode).toEqual(201);
            expect(res.body.data.name).toEqual('Transport');
            expect(res.body.data.type).toEqual('EXPENSE');
        });

        it('returns 422 for invalid category type', async () => {
            const res = await request(app).post('/api/categories').send({
                name: 'Invalid Type Category',
                type: 'INVALID',
            });

            expect(res.statusCode).toEqual(422);
            expect(res.body.message).toEqual('VALIDATION_FAILED');
            expect(res.body.errors[0]).toEqual(
                expect.objectContaining({
                    field: 'type',
                    code: 'VALIDATION_TYPE_INVALID_ENUM',
                })
            );
        });
    });

    describe('PUT /api/categories/:id', () => {
        let testCategoryId;

        beforeAll(async () => {
            const category = await mockCategory.create({ name: 'Entertainment', type: 'EXPENSE' });
            testCategoryId = category.id;
        });

        it('updates category details', async () => {
            const res = await request(app).put(`/api/categories/${testCategoryId}`).send({
                name: 'Fun',
                icon: 'Smile',
            });

            expect(res.statusCode).toEqual(200);
            expect(res.body.data.name).toEqual('Fun');
            expect(res.body.data.icon).toEqual('Smile');
        });

        it('returns 404 for a non-existent category', async () => {
            const crypto = require('crypto');
            const res = await request(app).put(`/api/categories/${crypto.randomUUID()}`).send({
                name: 'Missing',
            });

            expect(res.statusCode).toEqual(404);
            expect(res.body.message).toEqual('CATEGORY_NOT_FOUND');
        });

        it('returns 422 for an invalid UUID format', async () => {
            const res = await request(app).put('/api/categories/not-a-uuid').send({
                name: 'Invalid ID',
            });

            expect(res.statusCode).toEqual(422);
            expect(res.body.message).toEqual('VALIDATION_FAILED');
        });
    });

    describe('DELETE /api/categories/:id', () => {
        let deleteCategoryId;

        beforeAll(async () => {
            const category = await mockCategory.create({ name: 'To Be Deleted', type: 'INCOME' });
            deleteCategoryId = category.id;
        });

        it('returns 404 if category does not exist', async () => {
            const crypto = require('crypto');
            const res = await request(app).delete(`/api/categories/${crypto.randomUUID()}`);
            expect(res.statusCode).toEqual(404);
            expect(res.body.message).toEqual('CATEGORY_NOT_FOUND');
        });

        it('deletes category successfully', async () => {
            const res = await request(app).delete(`/api/categories/${deleteCategoryId}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.message).toEqual('CATEGORY_DELETE_SUCCESS');

            const checkRes = await request(app).delete(`/api/categories/${deleteCategoryId}`);
            expect(checkRes.statusCode).toEqual(404);
        });
    });
});
