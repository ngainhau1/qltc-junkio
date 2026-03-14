'use strict';

const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

module.exports = {
    async up(queryInterface) {
        const now = new Date();
        const passwordHash = bcrypt.hashSync('demo123', 10);

        // Users
        const adminId = uuidv4();
        const userId = uuidv4();
        await queryInterface.bulkInsert('Users', [
            {
                id: adminId,
                name: 'Demo Admin',
                email: 'demo_admin@junkio.com',
                password_hash: passwordHash,
                role: 'admin',
                createdAt: now,
                updatedAt: now
            },
            {
                id: userId,
                name: 'Demo User',
                email: 'demo_user@junkio.com',
                password_hash: passwordHash,
                role: 'member',
                createdAt: now,
                updatedAt: now
            }
        ], {});

        // Family + members
        const familyId = uuidv4();
        await queryInterface.bulkInsert('Families', [{
            id: familyId,
            name: 'Demo Family',
            owner_id: adminId,
            createdAt: now,
            updatedAt: now
        }], {});

        await queryInterface.bulkInsert('FamilyMembers', [
            {
                id: uuidv4(),
                family_id: familyId,
                user_id: adminId,
                role: 'owner',
                createdAt: now,
                updatedAt: now
            },
            {
                id: uuidv4(),
                family_id: familyId,
                user_id: userId,
                role: 'member',
                createdAt: now,
                updatedAt: now
            }
        ], {});

        // Categories
        const expenseNames = ['Ăn uống', 'Di chuyển', 'Nhà cửa', 'Giải trí', 'Mua sắm', 'Học phí'];
        const incomeNames = ['Lương', 'Thưởng', 'Đầu tư'];
        const categories = [];
        const categoryIds = {};

        expenseNames.forEach(name => {
            const id = uuidv4();
            categoryIds[name] = id;
            categories.push({ id, name, type: 'EXPENSE', createdAt: now, updatedAt: now });
        });
        incomeNames.forEach(name => {
            const id = uuidv4();
            categoryIds[name] = id;
            categories.push({ id, name, type: 'INCOME', createdAt: now, updatedAt: now });
        });
        await queryInterface.bulkInsert('Categories', categories, {});

        // Wallets (2 cá nhân + 1 gia đình)
        const adminWalletId = uuidv4();
        const userWalletId = uuidv4();
        const familyWalletId = uuidv4();
        await queryInterface.bulkInsert('Wallets', [
            { id: adminWalletId, name: 'Ví Tiền Mặt', balance: 12000000, currency: 'VND', user_id: adminId, family_id: null, createdAt: now, updatedAt: now },
            { id: userWalletId, name: 'Ví Tiết Kiệm', balance: 8000000, currency: 'VND', user_id: userId, family_id: null, createdAt: now, updatedAt: now },
            { id: familyWalletId, name: 'Quỹ Gia Đình', balance: 5000000, currency: 'VND', user_id: null, family_id: familyId, createdAt: now, updatedAt: now }
        ], {});

        // Transactions (12 mục đa dạng)
        const transactions = [
            { description: 'Lương tháng 3', amount: 15000000, type: 'INCOME', wallet_id: adminWalletId, category_id: categoryIds['Lương'], user_id: adminId, date: new Date(), createdAt: now, updatedAt: now },
            { description: 'Bonus Q1', amount: 3000000, type: 'INCOME', wallet_id: adminWalletId, category_id: categoryIds['Thưởng'], user_id: adminId, date: new Date(), createdAt: now, updatedAt: now },
            { description: 'Đầu tư cổ tức', amount: 1200000, type: 'INCOME', wallet_id: userWalletId, category_id: categoryIds['Đầu tư'], user_id: userId, date: new Date(), createdAt: now, updatedAt: now },
            { description: 'Siêu thị cuối tuần', amount: 650000, type: 'EXPENSE', wallet_id: familyWalletId, category_id: categoryIds['Ăn uống'], user_id: adminId, date: new Date(), createdAt: now, updatedAt: now },
            { description: 'Tiền xăng xe', amount: 300000, type: 'EXPENSE', wallet_id: userWalletId, category_id: categoryIds['Di chuyển'], user_id: userId, date: new Date(), createdAt: now, updatedAt: now },
            { description: 'Thuê nhà tháng', amount: 4500000, type: 'EXPENSE', wallet_id: adminWalletId, category_id: categoryIds['Nhà cửa'], user_id: adminId, date: new Date(), createdAt: now, updatedAt: now },
            { description: 'Netflix', amount: 260000, type: 'EXPENSE', wallet_id: userWalletId, category_id: categoryIds['Giải trí'], user_id: userId, date: new Date(), createdAt: now, updatedAt: now },
            { description: 'Mua sắm quần áo', amount: 900000, type: 'EXPENSE', wallet_id: adminWalletId, category_id: categoryIds['Mua sắm'], user_id: adminId, date: new Date(), createdAt: now, updatedAt: now },
            { description: 'Đóng học phí', amount: 2500000, type: 'EXPENSE', wallet_id: familyWalletId, category_id: categoryIds['Học phí'], user_id: adminId, date: new Date(), createdAt: now, updatedAt: now },
            { description: 'Ăn tối gia đình', amount: 520000, type: 'EXPENSE', wallet_id: familyWalletId, category_id: categoryIds['Ăn uống'], user_id: userId, date: new Date(), createdAt: now, updatedAt: now },
            { description: 'Cà phê sáng', amount: 55000, type: 'EXPENSE', wallet_id: adminWalletId, category_id: categoryIds['Ăn uống'], user_id: adminId, date: new Date(), createdAt: now, updatedAt: now },
            { description: 'Tiền điện', amount: 780000, type: 'EXPENSE', wallet_id: adminWalletId, category_id: categoryIds['Nhà cửa'], user_id: adminId, date: new Date(), createdAt: now, updatedAt: now }
        ].map(t => ({ ...t, id: uuidv4() }));

        await queryInterface.bulkInsert('Transactions', transactions, {});

        // Transaction shares (để demo modal chi tiết)
        const shares = [];
        const shareTargets = transactions.filter(t => [ 'Siêu thị cuối tuần', 'Đóng học phí', 'Ăn tối gia đình' ].includes(t.description));
        shareTargets.forEach(t => {
            const half = parseFloat(t.amount) / 2;
            shares.push({
                id: uuidv4(),
                transaction_id: t.id,
                user_id: adminId,
                amount: half,
                status: 'PAID',
                created_at: now,
                updated_at: now
            });
            shares.push({
                id: uuidv4(),
                transaction_id: t.id,
                user_id: userId,
                amount: half,
                status: 'UNPAID',
                created_at: now,
                updated_at: now
            });
        });
        await queryInterface.bulkInsert('transaction_shares', shares, {});

        // Goals (3 mục tiêu)
        await queryInterface.bulkInsert('goals', [
            { id: uuidv4(), name: 'Mua xe máy', targetAmount: 15000000, currentAmount: 4000000, deadline: new Date(new Date().setMonth(now.getMonth() + 6)), colorCode: '#3b82f6', imageUrl: 'Bike', status: 'IN_PROGRESS', user_id: userId, created_at: now, updated_at: now },
            { id: uuidv4(), name: 'Quỹ du lịch Đà Lạt', targetAmount: 8000000, currentAmount: 2500000, deadline: new Date(new Date().setMonth(now.getMonth() + 4)), colorCode: '#22c55e', imageUrl: 'Plane', status: 'IN_PROGRESS', user_id: adminId, created_at: now, updated_at: now },
            { id: uuidv4(), name: 'Dự phòng khẩn cấp', targetAmount: 10000000, currentAmount: 6000000, deadline: null, colorCode: '#f59e0b', imageUrl: 'Shield', status: 'IN_PROGRESS', user_id: adminId, created_at: now, updated_at: now }
        ], {});

        // Budgets (2)
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        await queryInterface.bulkInsert('Budgets', [
            { id: uuidv4(), amount_limit: 3000000, start_date: start, end_date: end, category_id: categoryIds['Ăn uống'], family_id: familyId, createdAt: now, updatedAt: now },
            { id: uuidv4(), amount_limit: 2000000, start_date: start, end_date: end, category_id: categoryIds['Giải trí'], family_id: familyId, createdAt: now, updatedAt: now }
        ], {});
    },

    async down(queryInterface) {
        await queryInterface.bulkDelete('Budgets', null, {});
        await queryInterface.bulkDelete('transaction_shares', null, {});
        await queryInterface.bulkDelete('Transactions', null, {});
        await queryInterface.bulkDelete('Wallets', null, {});
        await queryInterface.bulkDelete('Categories', null, {});
        await queryInterface.bulkDelete('FamilyMembers', null, {});
        await queryInterface.bulkDelete('Families', null, {});
        await queryInterface.bulkDelete('goals', null, {});
        await queryInterface.bulkDelete('Users', null, {});
    }
};
