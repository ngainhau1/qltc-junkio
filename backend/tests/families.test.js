const request = require('supertest');
const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');

jest.mock('uuid', () => {
    const crypto = require('crypto');
    return { v4: () => crypto.randomUUID() };
});

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

let mockUserId;
jest.mock('../middleware/authMiddleware', () => (req, res, next) => {
    req.user = { id: mockUserId, email: 'owner@example.com', role: 'USER' };
    next();
});

const familyRoutes = require('../routes/familyRoutes');

const app = express();
app.use(express.json());
app.use('/api/families', familyRoutes);

describe('Family API Endpoints', () => {
    let ownerId;
    let memberId;
    let nonMemberId;
    let testFamilyId;

    beforeAll(async () => {
        await mockSequelize.sync({ force: true });

        const owner = await mockUser.create({ name: 'Owner', email: 'owner@ex.com' });
        ownerId = owner.id;

        const member = await mockUser.create({ name: 'Member', email: 'member@ex.com' });
        memberId = member.id;

        const nonMember = await mockUser.create({ name: 'Stranger', email: 'stranger@ex.com' });
        nonMemberId = nonMember.id;

        const family = await mockFamily.create({ name: 'Test Family', owner_id: ownerId });
        testFamilyId = family.id;

        await mockFamilyMember.create({ family_id: family.id, user_id: ownerId, role: 'ADMIN' });
        await mockFamilyMember.create({ family_id: family.id, user_id: memberId, role: 'MEMBER' });
        await mockWallet.create({ name: 'Family Wallet', balance: 5000, family_id: family.id });
    });

    afterAll(async () => {
        await mockSequelize.close();
    });

    it('lists families for a participating user', async () => {
        mockUserId = ownerId;

        const res = await request(app).get('/api/families');

        expect(res.statusCode).toEqual(200);
        expect(res.body.data).toBeInstanceOf(Array);
        expect(res.body.data).toHaveLength(1);
        expect(res.body.data[0].name).toBe('Test Family');
    });

    it('creates a new family and a default wallet', async () => {
        mockUserId = memberId;

        const res = await request(app).post('/api/families').send({
            name: 'Member New Family'
        });

        expect(res.statusCode).toEqual(201);
        expect(res.body.data.name).toBe('Member New Family');

        const familyMembers = await mockFamilyMember.findAll({ where: { family_id: res.body.data.id } });
        const wallets = await mockWallet.findAll({ where: { family_id: res.body.data.id } });

        expect(familyMembers).toHaveLength(1);
        expect(familyMembers[0].role).toBe('ADMIN');
        expect(wallets).toHaveLength(1);
        expect(wallets[0].name).toBeTruthy();
    });

    it('returns 422 for an invalid family name', async () => {
        const res = await request(app).post('/api/families').send({ name: '' });

        expect(res.statusCode).toEqual(422);
    });

    it('returns family details for a member', async () => {
        mockUserId = memberId;

        const res = await request(app).get(`/api/families/${testFamilyId}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.data.name).toBe('Test Family');
        const members = res.body.data.Members || res.body.data.FamilyMembers || [];
        const wallets = res.body.data.Wallets || res.body.data.wallets || [];
        expect(Array.isArray(members)).toBe(true);
        expect(Array.isArray(wallets)).toBe(true);
        expect(wallets.length).toBeGreaterThanOrEqual(1);
    });

    it('returns 403 for a non-member', async () => {
        mockUserId = nonMemberId;

        const res = await request(app).get(`/api/families/${testFamilyId}`);

        expect(res.statusCode).toEqual(403);
        expect(res.body.message).toBeTruthy();
    });

    it('adds a member when the caller is admin', async () => {
        mockUserId = ownerId;

        const res = await request(app).post(`/api/families/${testFamilyId}/members`).send({
            email: 'stranger@ex.com',
            role: 'MEMBER'
        });

        expect(res.statusCode).toEqual(201);
        expect(res.body.message).toBeTruthy();

        const memberRecord = await mockFamilyMember.findOne({
            where: { family_id: testFamilyId, user_id: nonMemberId }
        });
        expect(memberRecord).not.toBeNull();
    });

    it('rejects member creation when the caller is not admin', async () => {
        mockUserId = memberId;

        const res = await request(app).post(`/api/families/${testFamilyId}/members`).send({
            email: 'another@email.com'
        });

        expect(res.statusCode).toEqual(403);
        expect(res.body.message).toBeTruthy();
    });

    it('rejects adding a user who is already a member', async () => {
        mockUserId = ownerId;

        const res = await request(app).post(`/api/families/${testFamilyId}/members`).send({
            email: 'stranger@ex.com'
        });

        expect(res.statusCode).toEqual(400);
        expect(res.body.message).toBeTruthy();
    });

    it('removes a member when the caller is admin', async () => {
        mockUserId = ownerId;

        const res = await request(app).delete(`/api/families/${testFamilyId}/members/${nonMemberId}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toBeTruthy();
    });

    it('rejects removing the family owner', async () => {
        mockUserId = ownerId;

        const res = await request(app).delete(`/api/families/${testFamilyId}/members/${ownerId}`);

        expect(res.statusCode).toEqual(400);
        expect(res.body.message).toBeTruthy();
    });

    it('rejects deleting a family when the caller is not the owner', async () => {
        mockUserId = memberId;

        const res = await request(app).delete(`/api/families/${testFamilyId}`);

        expect(res.statusCode).toEqual(403);
        expect(res.body.message).toBeTruthy();
    });

    it('deletes a family when the caller is the owner', async () => {
        mockUserId = ownerId;

        const tempFamily = await mockFamily.create({ name: 'Temp', owner_id: ownerId });
        await mockFamilyMember.create({ family_id: tempFamily.id, user_id: ownerId, role: 'ADMIN' });

        const res = await request(app).delete(`/api/families/${tempFamily.id}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toBeTruthy();

        const deletedFamily = await mockFamily.findByPk(tempFamily.id);
        expect(deletedFamily).toBeNull();
    });
});
