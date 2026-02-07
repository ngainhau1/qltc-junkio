'use strict';
const { faker } = require('@faker-js/faker');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create Users
    const users = [];
    // Fixed Demo User
    const demoUserId = uuidv4();
    users.push({
      id: demoUserId,
      name: 'Demo User',
      email: 'demo@junkio.com',
      password_hash: '$2b$10$YourHashedPasswordHere', // Use bcrypt hash in real app
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Random Users
    for (let i = 0; i < 5; i++) {
      users.push({
        id: uuidv4(),
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password_hash: 'hashedpassword',
        role: 'member',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    await queryInterface.bulkInsert('Users', users, {});

    // 2. Create Family
    const familyId = uuidv4();
    await queryInterface.bulkInsert('Families', [{
      id: familyId,
      name: 'Gia Đình Demo',
      owner_id: demoUserId,
      createdAt: new Date(),
      updatedAt: new Date()
    }], {});

    // 3. Family Members
    await queryInterface.bulkInsert('FamilyMembers', [{
      id: uuidv4(),
      family_id: familyId,
      user_id: demoUserId,
      role: 'owner',
      createdAt: new Date(),
      updatedAt: new Date()
    }], {});

    // 4. Categories
    const categories = [];
    const expCats = ['Ăn uống', 'Di chuyển', 'Nhà cửa', 'Giải trí', 'Mua sắm'];
    const incCats = ['Lương', 'Thưởng', 'Đầu tư'];
    const catIds = [];

    for (const c of expCats) {
      const id = uuidv4();
      catIds.push(id);
      categories.push({
        id: id,
        name: c,
        type: 'EXPENSE',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    for (const c of incCats) {
      const id = uuidv4();
      catIds.push(id);
      categories.push({
        id: id,
        name: c,
        type: 'INCOME',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    await queryInterface.bulkInsert('Categories', categories, {});

    // 5. Wallets
    const walletId = uuidv4();
    await queryInterface.bulkInsert('Wallets', [{
      id: walletId,
      name: 'Ví Tiền Mặt',
      balance: 10000000,
      currency: 'VND',
      user_id: demoUserId,
      family_id: familyId,
      createdAt: new Date(),
      updatedAt: new Date()
    }], {});

    // 6. Transactions (50 items)
    const transactions = [];
    for (let i = 0; i < 50; i++) {
      transactions.push({
        id: uuidv4(),
        amount: parseFloat(faker.finance.amount(10000, 500000, 0)),
        date: faker.date.recent({ days: 60 }),
        description: faker.commerce.productName(),
        type: Math.random() > 0.3 ? 'EXPENSE' : 'INCOME',
        wallet_id: walletId,
        category_id: catIds[Math.floor(Math.random() * catIds.length)],
        user_id: demoUserId,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    await queryInterface.bulkInsert('Transactions', transactions, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Transactions', null, {});
    await queryInterface.bulkDelete('Wallets', null, {});
    await queryInterface.bulkDelete('Categories', null, {});
    await queryInterface.bulkDelete('FamilyMembers', null, {});
    await queryInterface.bulkDelete('Families', null, {});
    await queryInterface.bulkDelete('Users', null, {});
  }
};
