const request = require('supertest');
const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');

// Mock uuid
jest.mock('uuid', () => {
    const crypto = require('crypto');
    return { v4: () => crypto.randomUUID() };
});

// Setup mock DB & model
const mockSequelize = new Sequelize('sqlite::memory:', { logging: false });

const mockUser = mockSequelize.define('User', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING },
    email: { type: DataTypes.STRING, unique: true }
});

const mockFamily = mockSequelize.define('Family', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING },
    owner_id: { type: DataTypes.UUID }
});

const mockFamilyMember = mockSequelize.define('FamilyMember', {
    role: { type: DataTypes.STRING, defaultValue: 'MEMBER' },
    joined_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
});

const mockWallet = mockSequelize.define('Wallet', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING },
    balance: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
    currency: { type: DataTypes.STRING, defaultValue: 'VND' }
});

// Define Relationships
mockFamily.belongsToMany(mockUser, { through: mockFamilyMember, as: 'Members', foreignKey: 'family_id', otherKey: 'user_id' });
mockUser.belongsToMany(mockFamily, { through: mockFamilyMember, as: 'Families', foreignKey: 'user_id', otherKey: 'family_id' });

mockFamily.belongsTo(mockUser, { as: 'Owner', foreignKey: 'owner_id' });
mockUser.hasMany(mockFamily, { foreignKey: 'owner_id' });

mockFamily.hasMany(mockWallet, { foreignKey: 'family_id' });
mockWallet.belongsTo(mockFamily, { foreignKey: 'family_id' });

mockFamilyMember.belongsTo(mockFamily, { foreignKey: 'family_id' });
mockFamily.hasMany(mockFamilyMember, { foreignKey: 'family_id' });
mockFamilyMember.belongsTo(mockUser, { foreignKey: 'user_id' });

jest.mock('../models/index', () => ({
    sequelize: mockSequelize,
    User: mockUser,
    Family: mockFamily,
    FamilyMember: mockFamilyMember,
    Wallet: mockWallet
}));
jest.mock('../models', () => ({
    sequelize: mockSequelize,
    User: mockUser,
    Family: mockFamily,
    FamilyMember: mockFamilyMember,
    Wallet: mockWallet
}));

// Mock authMiddleware AFTER setting up models because routes require auth
let mockUserId; // We can change this mid-test to simulate different users
jest.mock('../middleware/authMiddleware', () => (req, res, next) => {
    req.user = { id: mockUserId, email: 'owner@example.com', role: 'USER' };
    next();
});

const familyRoutes = require('../routes/familyRoutes');

const app = express();
app.use(express.json());
app.use('/api/families', familyRoutes);

describe('Family API Endpoints', () => {
    let ownerId, memberId, nonMemberId, testFamilyId;

    beforeAll(async () => {
        await mockSequelize.sync({ force: true });

        // Users
        const owner = await mockUser.create({ name: 'Owner', email: 'owner@ex.com' });
        ownerId = owner.id;
        
        const member = await mockUser.create({ name: 'Member', email: 'member@ex.com' });
        memberId = member.id;

        const nonMember = await mockUser.create({ name: 'Stranger', email: 'stranger@ex.com' });
        nonMemberId = nonMember.id;

        // Family & relationships
        const fam = await mockFamily.create({ name: 'Test Family', owner_id: ownerId });
        testFamilyId = fam.id;

        await mockFamilyMember.create({ family_id: fam.id, user_id: ownerId, role: 'ADMIN' });
        await mockFamilyMember.create({ family_id: fam.id, user_id: memberId, role: 'MEMBER' });

        await mockWallet.create({ name: 'Family Wallet', balance: 5000, family_id: fam.id });
    });

    afterAll(async () => {
        await mockSequelize.close();
    });

    describe('GET /api/families', () => {
        it('should list families user is part of', async () => {
            mockUserId = ownerId; // auth as owner
            const res = await request(app).get('/api/families');
            expect(res.statusCode).toEqual(200);
            expect(res.body.data).toBeInstanceOf(Array);
            expect(res.body.data.length).toBe(1);
            expect(res.body.data[0].name).toBe('Test Family');
        });
    });

    describe('POST /api/families', () => {
        it('should create a new family and default wallet', async () => {
            mockUserId = memberId; // let's let memberId create their own family
            const res = await request(app).post('/api/families').send({
                name: 'Member New Family'
            });
            expect(res.statusCode).toEqual(201);
            expect(res.body.data.name).toBe('Member New Family');
            
            const famId = res.body.data.id;
            
            // Should add creator as Admin
            const fms = await mockFamilyMember.findAll({ where: { family_id: famId } });
            expect(fms.length).toBe(1);
            expect(fms[0].role).toBe('ADMIN');

            // Should create default wallet
            const wallets = await mockWallet.findAll({ where: { family_id: famId } });
            expect(wallets.length).toBe(1);
            expect(wallets[0].name).toBe('Quỹ chung gia đình');
        });

        it('should return 422 if name is invalid', async () => {
            const res = await request(app).post('/api/families').send({ name: '' });
            expect(res.statusCode).toEqual(422);
        });
    });

    describe('GET /api/families/:id', () => {
        it('should get family details if part of family', async () => {
            mockUserId = memberId;
            const res = await request(app).get(`/api/families/${testFamilyId}`);
            expect(res.statusCode).toEqual(200);
            expect(res.body.data.name).toBe('Test Family');
            expect(res.body.data.Members.length).toBe(2);
            expect(res.body.data.Wallets.length).toBe(1); // 'Wallets' because eager loading uses table name usually, or `Wallets` property
        });

        it('should return 403 if not part of family', async () => {
            mockUserId = nonMemberId;
            const res = await request(app).get(`/api/families/${testFamilyId}`);
            expect(res.statusCode).toEqual(403);
            expect(res.body.message).toMatch(/Bạn không phải là thành viên/);
        });
    });

    describe('POST /api/families/:id/members', () => {
        it('should add member if caller is ADMIN', async () => {
            mockUserId = ownerId; // Owner is ADMIN
            const res = await request(app).post(`/api/families/${testFamilyId}/members`).send({
                email: 'stranger@ex.com',
                role: 'MEMBER'
            });
            expect(res.statusCode).toEqual(201);
            expect(res.body.message).toMatch(/Thêm thành viên thành công/);
            
            const check = await mockFamilyMember.findOne({ where: { family_id: testFamilyId, user_id: nonMemberId } });
            expect(check).not.toBeNull();
        });

        it('should return 403 if caller is NOT ADMIN', async () => {
            mockUserId = memberId; // Standard member
            const res = await request(app).post(`/api/families/${testFamilyId}/members`).send({
                email: 'some1@email.com'
            });
            expect(res.statusCode).toEqual(403);
            expect(res.body.message).toMatch(/Chỉ Admin mới có thể thêm thành viên/);
        });

        it('should return 400 if user is already a member', async () => {
            mockUserId = ownerId;
            const res = await request(app).post(`/api/families/${testFamilyId}/members`).send({
                email: 'stranger@ex.com' // Just added above
            });
            expect(res.statusCode).toEqual(400);
            expect(res.body.message).toMatch(/Người dùng đã là thành viên/);
        });
    });

    describe('DELETE /api/families/:id/members/:userIdToRemove', () => {
        it('should remove member if caller is ADMIN', async () => {
            mockUserId = ownerId; 
            const res = await request(app).delete(`/api/families/${testFamilyId}/members/${nonMemberId}`);
            expect(res.statusCode).toEqual(200);
            expect(res.body.message).toMatch(/Đã xóa thành viên thành công/);
        });

        it('should return 400 if trying to remove the owner', async () => {
            mockUserId = ownerId;
            const res = await request(app).delete(`/api/families/${testFamilyId}/members/${ownerId}`);
            expect(res.statusCode).toEqual(400);
            expect(res.body.message).toMatch(/Không thể xóa chủ gia đình/);
        });
    });

    describe('DELETE /api/families/:id', () => {
        it('should return 403 if caller is not owner', async () => {
            mockUserId = memberId;
            const res = await request(app).delete(`/api/families/${testFamilyId}`);
            expect(res.statusCode).toEqual(403);
            expect(res.body.message).toMatch(/Chỉ chủ gia đình mới được quyền xóa/);
        });

        it('should delete family completely if caller is owner', async () => {
            mockUserId = ownerId;
            // Let's create a temporary family to delete
            const tempFam = await mockFamily.create({ name: 'Temp', owner_id: ownerId });
            await mockFamilyMember.create({ family_id: tempFam.id, user_id: ownerId, role: 'ADMIN' });
            
            const res = await request(app).delete(`/api/families/${tempFam.id}`);
            expect(res.statusCode).toEqual(200);
            expect(res.body.message).toMatch(/Xóa gia đình thành công/);

            const f = await mockFamily.findByPk(tempFam.id);
            expect(f).toBeNull();
        });
    });
});
