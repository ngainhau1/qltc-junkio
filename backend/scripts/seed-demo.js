'use strict';

const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const { seedGoldHistoryDemo } = require('./lib/seed-gold-history-demo');
const {
    sequelize,
    User,
    Family,
    FamilyMember,
    Wallet,
    Category,
    Transaction,
    TransactionShare,
    Budget,
    Goal,
    Notification,
    RecurringPattern,
    AuditLog,
} = require('../models');

const DEMO_EMAIL = 'demo@junkio.com';
const DEMO_PASS = 'demo123';
const STAFF_EMAIL = 'staff@junkio.com';
const STAFF_PASS = 'staff123';
const ADMIN_EMAIL = 'admin@junkio.com';
const ADMIN_PASS = 'admin123';

const DEMO_BASE_DATE = new Date('2026-05-02T12:00:00+07:00');
const MAY_START = '2026-05-01';
const MAY_END = '2026-05-31';

const EXTRA_MEMBERS = Array.from({ length: 9 }, (_, index) => {
    const number = String(index + 1).padStart(2, '0');
    const names = [
        'Le Minh Anh',
        'Pham Quang Huy',
        'Vo Ngoc Linh',
        'Dang Hoai Nam',
        'Bui Khanh Vy',
        'Hoang Tuan Kiet',
        'Do Mai Phuong',
        'Nguyen Gia Bao',
        'Tran Ha My',
    ];

    return {
        name: names[index],
        email: `member${number}@junkio-demo.local`,
        password: 'demo123',
        role: 'member',
        is_locked: index === 8,
    };
});

const USER_SPECS = [
    { key: 'admin', name: 'Junkio Admin', email: ADMIN_EMAIL, password: ADMIN_PASS, role: 'admin', is_locked: false },
    { key: 'demo', name: 'Nguyen Van Demo', email: DEMO_EMAIL, password: DEMO_PASS, role: 'member', is_locked: false },
    { key: 'staff', name: 'Tran Thi Staff', email: STAFF_EMAIL, password: STAFF_PASS, role: 'staff', is_locked: false },
    ...EXTRA_MEMBERS.map((member, index) => ({ key: `member${index + 1}`, ...member })),
];

const SEEDED_EMAILS = USER_SPECS.map((user) => user.email);
const SEEDED_FAMILY_NAMES = ['Gia Đình Demo', 'Nhóm Văn Phòng Junkio', 'Quỹ Quản Trị Junkio'];

const CATEGORIES = [
    { name: 'Ăn uống', type: 'EXPENSE', icon: 'Utensils' },
    { name: 'Di chuyển', type: 'EXPENSE', icon: 'Car' },
    { name: 'Nhà cửa', type: 'EXPENSE', icon: 'Home' },
    { name: 'Giải trí', type: 'EXPENSE', icon: 'Gamepad2' },
    { name: 'Mua sắm', type: 'EXPENSE', icon: 'ShoppingBag' },
    { name: 'Sức khỏe', type: 'EXPENSE', icon: 'HeartPulse' },
    { name: 'Giáo dục', type: 'EXPENSE', icon: 'GraduationCap' },
    { name: 'Dịch vụ số', type: 'EXPENSE', icon: 'Smartphone' },
    { name: 'Lương', type: 'INCOME', icon: 'Briefcase' },
    { name: 'Thưởng', type: 'INCOME', icon: 'BadgeDollarSign' },
    { name: 'Đầu tư', type: 'INCOME', icon: 'TrendingUp' },
    { name: 'Thu nhập phụ', type: 'INCOME', icon: 'Coins' },
];

const EXPENSE_TEMPLATES = [
    { desc: 'Bữa tối gia đình Nhà Hàng Sài Gòn', amount: 580000, cat: 'Ăn uống' },
    { desc: 'Cà phê sáng The Coffee House', amount: 65000, cat: 'Ăn uống' },
    { desc: 'Giao đồ ăn Grab trưa văn phòng', amount: 85000, cat: 'Ăn uống' },
    { desc: 'Siêu thị Co.opmart cuối tuần', amount: 720000, cat: 'Ăn uống' },
    { desc: 'Xăng xe máy tuần này', amount: 130000, cat: 'Di chuyển' },
    { desc: 'Grab đến sân bay', amount: 250000, cat: 'Di chuyển' },
    { desc: 'Tiền thuê nhà tháng 5', amount: 4500000, cat: 'Nhà cửa' },
    { desc: 'Internet FPT tháng 5', amount: 220000, cat: 'Nhà cửa' },
    { desc: 'Quần Jean Levi sale', amount: 890000, cat: 'Mua sắm' },
    { desc: 'Tai nghe Bluetooth', amount: 450000, cat: 'Mua sắm' },
    { desc: 'Vé xem phim CGV', amount: 120000, cat: 'Giải trí' },
    { desc: 'Netflix tháng 5', amount: 260000, cat: 'Dịch vụ số' },
    { desc: 'Spotify Premium', amount: 59000, cat: 'Dịch vụ số' },
    { desc: 'Khám sức khỏe định kỳ', amount: 450000, cat: 'Sức khỏe' },
    { desc: 'Mua thuốc cảm cúm', amount: 85000, cat: 'Sức khỏe' },
    { desc: 'Gym tháng 5', amount: 350000, cat: 'Sức khỏe' },
    { desc: 'Khóa học Udemy React', amount: 299000, cat: 'Giáo dục' },
    { desc: 'Học phí tiếng Anh tháng 5', amount: 1200000, cat: 'Giáo dục' },
];

const INCOME_TEMPLATES = [
    { desc: 'Lương tháng 5/2026', amount: 18000000, cat: 'Lương' },
    { desc: 'Thưởng hiệu suất đầu tháng', amount: 4500000, cat: 'Thưởng' },
    { desc: 'Cổ tức danh mục đầu tư', amount: 2300000, cat: 'Đầu tư' },
    { desc: 'Freelance thiết kế landing page', amount: 1800000, cat: 'Thu nhập phụ' },
    { desc: 'Bán đồ cũ trên Shopee', amount: 650000, cat: 'Thu nhập phụ' },
];

const GOAL_TEMPLATES = [
    { name: 'Mua xe máy Honda Wave', targetAmount: 18000000, currentAmount: 6500000, icon: 'Bike', color: '#3b82f6' },
    { name: 'Quỹ du lịch Đà Nẵng', targetAmount: 10000000, currentAmount: 3200000, icon: 'Plane', color: '#22c55e' },
    { name: 'Dự phòng khẩn cấp 6 tháng', targetAmount: 30000000, currentAmount: 12000000, icon: 'Shield', color: '#f59e0b' },
    { name: 'Mua laptop làm việc', targetAmount: 28000000, currentAmount: 9000000, icon: 'Laptop', color: '#8b5cf6' },
    { name: 'Nâng cấp điện thoại', targetAmount: 22000000, currentAmount: 7500000, icon: 'Smartphone', color: '#06b6d4' },
    { name: 'Khóa học chuyên sâu', targetAmount: 12000000, currentAmount: 4500000, icon: 'GraduationCap', color: '#ec4899' },
    { name: 'Sửa nhà cuối năm', targetAmount: 50000000, currentAmount: 15500000, icon: 'Home', color: '#ef4444' },
    { name: 'Quỹ đầu tư dài hạn', targetAmount: 80000000, currentAmount: 22000000, icon: 'Coins', color: '#10b981' },
];

const RECURRING_TEMPLATES = [
    { description: 'Lương cố định hàng tháng', amount: 18000000, type: 'INCOME', cat: 'Lương', frequency: 'MONTHLY' },
    { description: 'Tiền thuê nhà hàng tháng', amount: 4500000, type: 'EXPENSE', cat: 'Nhà cửa', frequency: 'MONTHLY' },
    { description: 'Gói Netflix gia đình', amount: 260000, type: 'EXPENSE', cat: 'Dịch vụ số', frequency: 'MONTHLY' },
    { description: 'Gym định kỳ', amount: 350000, type: 'EXPENSE', cat: 'Sức khỏe', frequency: 'MONTHLY' },
    { description: 'Ăn trưa văn phòng', amount: 65000, type: 'EXPENSE', cat: 'Ăn uống', frequency: 'WEEKLY' },
    { description: 'Nạp quỹ đầu tư', amount: 2000000, type: 'EXPENSE', cat: 'Đầu tư', frequency: 'MONTHLY' },
];

const toDateOnly = (date) => date.toISOString().slice(0, 10);

const addDays = (date, amount) => {
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + amount);
    return nextDate;
};

const makeMayDate = (sequence) => {
    const day = sequence % 2 === 0 ? '01' : '02';
    const hour = String(7 + ((sequence * 5) % 14)).padStart(2, '0');
    const minute = String((sequence * 11) % 60).padStart(2, '0');
    return new Date(`2026-05-${day}T${hour}:${minute}:00+07:00`);
};

const makeAprilDate = (sequence) => {
    const day = String(20 + (sequence % 9)).padStart(2, '0');
    const hour = String(8 + (sequence % 10)).padStart(2, '0');
    const minute = String((sequence * 13) % 60).padStart(2, '0');
    return new Date(`2026-04-${day}T${hour}:${minute}:00+07:00`);
};

const createDestroyWhere = (conditions) => {
    const validConditions = conditions.filter(Boolean);
    if (validConditions.length === 0) return null;
    if (validConditions.length === 1) return validConditions[0];
    return { [Op.or]: validConditions };
};

async function cleanupSeededData() {
    const seededUsers = await User.findAll({
        where: { email: { [Op.in]: SEEDED_EMAILS } },
        attributes: ['id'],
    });
    const userIds = seededUsers.map((user) => user.id);

    const familyWhere = createDestroyWhere([
        userIds.length ? { owner_id: { [Op.in]: userIds } } : null,
        { name: { [Op.in]: SEEDED_FAMILY_NAMES } },
    ]);
    const seededFamilies = familyWhere
        ? await Family.findAll({ where: familyWhere, attributes: ['id'] })
        : [];
    const familyIds = seededFamilies.map((family) => family.id);

    const walletWhere = createDestroyWhere([
        userIds.length ? { user_id: { [Op.in]: userIds } } : null,
        familyIds.length ? { family_id: { [Op.in]: familyIds } } : null,
    ]);
    const seededWallets = walletWhere
        ? await Wallet.findAll({ where: walletWhere, attributes: ['id'] })
        : [];
    const walletIds = seededWallets.map((wallet) => wallet.id);

    const transactionWhere = createDestroyWhere([
        userIds.length ? { user_id: { [Op.in]: userIds } } : null,
        walletIds.length ? { wallet_id: { [Op.in]: walletIds } } : null,
        familyIds.length ? { family_id: { [Op.in]: familyIds } } : null,
    ]);
    const seededTransactions = transactionWhere
        ? await Transaction.findAll({ where: transactionWhere, attributes: ['id'] })
        : [];
    const transactionIds = seededTransactions.map((transaction) => transaction.id);

    const shareWhere = createDestroyWhere([
        transactionIds.length ? { transaction_id: { [Op.in]: transactionIds } } : null,
        userIds.length ? { user_id: { [Op.in]: userIds } } : null,
    ]);
    if (shareWhere) await TransactionShare.destroy({ where: shareWhere });
    if (userIds.length) {
        await Notification.destroy({ where: { user_id: { [Op.in]: userIds } } });
        await RecurringPattern.destroy({ where: { user_id: { [Op.in]: userIds } } });
        await AuditLog.destroy({ where: { user_id: { [Op.in]: userIds } } });
        await Goal.destroy({ where: { user_id: { [Op.in]: userIds } } });
    }
    if (transactionWhere) await Transaction.destroy({ where: transactionWhere });

    const budgetWhere = createDestroyWhere([
        userIds.length ? { user_id: { [Op.in]: userIds } } : null,
        familyIds.length ? { family_id: { [Op.in]: familyIds } } : null,
    ]);
    if (budgetWhere) await Budget.destroy({ where: budgetWhere });

    const familyMemberWhere = createDestroyWhere([
        userIds.length ? { user_id: { [Op.in]: userIds } } : null,
        familyIds.length ? { family_id: { [Op.in]: familyIds } } : null,
    ]);
    if (familyMemberWhere) await FamilyMember.destroy({ where: familyMemberWhere });
    if (walletWhere) await Wallet.destroy({ where: walletWhere });
    if (familyIds.length) await Family.destroy({ where: { id: { [Op.in]: familyIds } } });
    if (userIds.length) await User.destroy({ where: { id: { [Op.in]: userIds } } });
}

async function seedCategories() {
    const catMap = {};

    for (const category of CATEGORIES) {
        const [row] = await Category.findOrCreate({
            where: { name: category.name, type: category.type },
            defaults: {
                id: uuidv4(),
                name: category.name,
                type: category.type,
                icon: category.icon,
            },
        });

        if (!row.icon && category.icon) {
            await row.update({ icon: category.icon });
        }

        catMap[category.name] = row.id;
    }

    return catMap;
}

async function seedUsers() {
    const users = {};

    for (const spec of USER_SPECS) {
        users[spec.key] = await User.create({
            id: uuidv4(),
            name: spec.name,
            email: spec.email,
            password_hash: await bcrypt.hash(spec.password, 10),
            role: spec.role,
            is_locked: spec.is_locked,
        });
    }

    return users;
}

async function createWallets({ owner, family = null, specs, balanceLedger }) {
    const wallets = [];

    for (const spec of specs) {
        const wallet = await Wallet.create({
            id: uuidv4(),
            name: spec.name,
            balance: spec.balance,
            currency: 'VND',
            user_id: family ? null : owner.id,
            family_id: family?.id || null,
        });

        balanceLedger.set(wallet.id, Number(spec.balance));
        wallets.push(wallet);
    }

    return wallets;
}

const applyBalance = (balanceLedger, walletId, type, amount) => {
    const currentBalance = Number(balanceLedger.get(walletId) || 0);
    const signedAmount = type === 'INCOME' || type === 'TRANSFER_IN' ? Number(amount) : -Number(amount);
    balanceLedger.set(walletId, currentBalance + signedAmount);
};

async function createTransaction({ user, wallet, catMap, categoryName, amount, type, description, date, family = null, balanceLedger }) {
    const transaction = await Transaction.create({
        id: uuidv4(),
        user_id: user.id,
        wallet_id: wallet.id,
        category_id: catMap[categoryName] || null,
        amount,
        type,
        description,
        date,
        family_id: family?.id || null,
    });

    applyBalance(balanceLedger, wallet.id, type, amount);
    return transaction;
}

async function seedPersonalTransactions({ user, wallets, catMap, balanceLedger, count, offset = 0, incomeEvery = 7 }) {
    for (let index = 0; index < count; index += 1) {
        const isIncome = index % incomeEvery === 0;
        const template = isIncome
            ? INCOME_TEMPLATES[Math.floor(index / incomeEvery) % INCOME_TEMPLATES.length]
            : EXPENSE_TEMPLATES[(index + offset) % EXPENSE_TEMPLATES.length];
        const wallet = wallets[(index + offset) % wallets.length];

        await createTransaction({
            user,
            wallet,
            catMap,
            categoryName: template.cat,
            amount: template.amount + (isIncome ? (offset * 100000) : ((index % 5) * 15000)),
            type: isIncome ? 'INCOME' : 'EXPENSE',
            description: `${template.desc} #${index + 1}`,
            date: makeMayDate(index + offset),
            balanceLedger,
        });
    }
}

async function seedHistoricalTransactions({ user, wallets, catMap, balanceLedger, count, offset = 0 }) {
    for (let index = 0; index < count; index += 1) {
        const template = index % 4 === 0
            ? INCOME_TEMPLATES[(index + offset) % INCOME_TEMPLATES.length]
            : EXPENSE_TEMPLATES[(index + offset) % EXPENSE_TEMPLATES.length];
        const type = index % 4 === 0 ? 'INCOME' : 'EXPENSE';

        await createTransaction({
            user,
            wallet: wallets[(index + offset) % wallets.length],
            catMap,
            categoryName: template.cat,
            amount: template.amount,
            type,
            description: `${template.desc} tháng 4`,
            date: makeAprilDate(index + offset),
            balanceLedger,
        });
    }
}

async function seedFamilyTransactions({ family, wallets, members, catMap, balanceLedger, count, offset = 0 }) {
    for (let index = 0; index < count; index += 1) {
        const payer = members[(index + offset) % members.length];
        const wallet = wallets[(index + offset) % wallets.length];
        const template = EXPENSE_TEMPLATES[(index + offset) % EXPENSE_TEMPLATES.length];
        const amount = template.amount + ((index % 4) * 50000);
        const transaction = await createTransaction({
            user: payer,
            wallet,
            catMap,
            categoryName: template.cat,
            amount,
            type: 'EXPENSE',
            description: `${family.name} - ${template.desc}`,
            date: makeMayDate(index + offset + 40),
            family,
            balanceLedger,
        });

        const debtors = members.filter((member) => member.id !== payer.id).slice(0, 3);
        const shareAmount = Math.round(amount / (debtors.length + 1));

        for (const debtor of debtors) {
            await TransactionShare.create({
                id: uuidv4(),
                transaction_id: transaction.id,
                user_id: debtor.id,
                amount: shareAmount,
                status: index % 5 === 0 ? 'PAID' : 'UNPAID',
                approval_status: 'APPROVED',
            });
        }
    }
}

async function seedGoals(user, count) {
    const rows = Array.from({ length: count }, (_, index) => {
        const template = GOAL_TEMPLATES[index % GOAL_TEMPLATES.length];
        return {
            id: uuidv4(),
            name: template.name,
            user_id: user.id,
            targetAmount: template.targetAmount + (index * 1500000),
            currentAmount: template.currentAmount + (index * 350000),
            deadline: addDays(DEMO_BASE_DATE, 45 + index * 15),
            colorCode: template.color,
            imageUrl: template.icon,
            status: 'IN_PROGRESS',
        };
    });

    await Goal.bulkCreate(rows, { individualHooks: false });
}

async function seedBudgets({ user = null, family = null, catMap, count }) {
    const expenseCategories = CATEGORIES.filter((category) => category.type === 'EXPENSE');
    const rows = Array.from({ length: count }, (_, index) => {
        const category = expenseCategories[index % expenseCategories.length];
        return {
            id: uuidv4(),
            amount_limit: 1200000 + (index * 550000),
            start_date: MAY_START,
            end_date: MAY_END,
            category_id: catMap[category.name],
            family_id: family?.id || null,
            user_id: family ? null : user.id,
        };
    });

    await Budget.bulkCreate(rows);
}

async function seedRecurring({ user, wallets, catMap, count, offset = 0 }) {
    const rows = Array.from({ length: count }, (_, index) => {
        const template = RECURRING_TEMPLATES[(index + offset) % RECURRING_TEMPLATES.length];
        return {
            id: uuidv4(),
            user_id: user.id,
            wallet_id: wallets[(index + offset) % wallets.length].id,
            category_id: catMap[template.cat] || null,
            amount: template.amount,
            type: template.type,
            description: template.description,
            frequency: template.frequency,
            next_run_date: toDateOnly(addDays(DEMO_BASE_DATE, index < 3 ? index + 1 : 28 + index)),
            is_active: index % 5 !== 4,
        };
    });

    await RecurringPattern.bulkCreate(rows);
}

async function seedNotifications(users) {
    const mainUsers = [users.demo, users.staff, users.admin];
    const rows = mainUsers.flatMap((user, index) => ([
        {
            id: uuidv4(),
            type: 'SYSTEM',
            title: 'Demo data ready',
            message: 'Dữ liệu demo tháng 05/2026 đã sẵn sàng để trình bày.',
            isRead: index === 2,
            user_id: user.id,
        },
        {
            id: uuidv4(),
            type: 'BUDGET',
            title: 'Budget reminder',
            message: 'Một số ngân sách tháng 05 đang gần mức cảnh báo.',
            isRead: false,
            user_id: user.id,
        },
    ]));

    await Notification.bulkCreate(rows);
}

async function seedAuditLogs(users, families) {
    const rows = [
        { user: users.admin, action: 'USER_LOGIN', entityType: 'AUTH', entityId: users.admin.id },
        { user: users.admin, action: 'ROLE_CHANGED', entityType: 'USER', entityId: users.staff.id, newValue: { role: 'staff' } },
        { user: users.staff, action: 'USER_LOGIN', entityType: 'AUTH', entityId: users.staff.id },
        { user: users.demo, action: 'USER_REGISTER', entityType: 'USER', entityId: users.demo.id },
        { user: users.admin, action: 'USER_LOCKED_UNLOCKED', entityType: 'USER', entityId: users.member9.id, newValue: { is_locked: true } },
    ];

    await AuditLog.bulkCreate(rows.map((row, index) => ({
        id: uuidv4(),
        user_id: row.user.id,
        family_id: families[index % families.length].id,
        action: row.action,
        entity_type: row.entityType,
        entity_id: row.entityId,
        old_value: row.oldValue || null,
        new_value: row.newValue || null,
        ip_address: '127.0.0.1',
        createdAt: addDays(DEMO_BASE_DATE, -index),
        updatedAt: addDays(DEMO_BASE_DATE, -index),
    })));
}

async function flushWalletBalances(balanceLedger) {
    for (const [walletId, balance] of balanceLedger.entries()) {
        await Wallet.update(
            { balance: Math.max(0, Math.round(balance)) },
            { where: { id: walletId } }
        );
    }
}

async function main() {
    await sequelize.authenticate();
    console.log('DB ket noi thanh cong.\n');

    console.log('=== BUOC 1: Don dep demo data cu ===');
    await cleanupSeededData();
    console.log(`  Da xoa du lieu cua ${SEEDED_EMAILS.length} email seed.`);

    console.log('\n=== BUOC 2: Tao categories ===');
    const catMap = await seedCategories();
    console.log(`  ${CATEGORIES.length} categories san sang.`);

    console.log('\n=== BUOC 3: Tao 12 users ===');
    const users = await seedUsers();
    console.log('  Demo/Admin/Staff va 9 member phu da tao.');

    const balanceLedger = new Map();

    console.log('\n=== BUOC 4: Tao wallets ===');
    const demoWallets = await createWallets({
        owner: users.demo,
        balanceLedger,
        specs: [
            { name: 'Ví Tiền Mặt', balance: 7000000 },
            { name: 'Thẻ Ngân Hàng', balance: 28000000 },
            { name: 'Ví Momo', balance: 2500000 },
            { name: 'Tài khoản tiết kiệm', balance: 45000000 },
            { name: 'Quỹ đầu tư cá nhân', balance: 65000000 },
        ],
    });
    const staffWallets = await createWallets({
        owner: users.staff,
        balanceLedger,
        specs: [
            { name: 'Ví Staff', balance: 5500000 },
            { name: 'Thẻ lương Staff', balance: 21000000 },
            { name: 'Quỹ học tập Staff', balance: 9000000 },
        ],
    });
    const adminWallets = await createWallets({
        owner: users.admin,
        balanceLedger,
        specs: [
            { name: 'Ví Admin', balance: 50000000 },
            { name: 'Tài khoản vận hành', balance: 85000000 },
            { name: 'Quỹ quản trị', balance: 120000000 },
        ],
    });

    console.log('\n=== BUOC 5: Tao families ===');
    const demoFamily = await Family.create({ id: uuidv4(), name: 'Gia Đình Demo', owner_id: users.demo.id });
    const officeFamily = await Family.create({ id: uuidv4(), name: 'Nhóm Văn Phòng Junkio', owner_id: users.staff.id });
    const adminFamily = await Family.create({ id: uuidv4(), name: 'Quỹ Quản Trị Junkio', owner_id: users.admin.id });
    const families = [demoFamily, officeFamily, adminFamily];

    const demoFamilyMembers = [users.demo, users.admin, users.staff, users.member1, users.member2, users.member3];
    const officeFamilyMembers = [users.staff, users.member4, users.member5, users.member6, users.demo];
    const adminFamilyMembers = [users.admin, users.staff, users.member7, users.member8, users.member9];
    const familyGroups = [
        { family: demoFamily, owner: users.demo, members: demoFamilyMembers },
        { family: officeFamily, owner: users.staff, members: officeFamilyMembers },
        { family: adminFamily, owner: users.admin, members: adminFamilyMembers },
    ];

    for (const group of familyGroups) {
        for (const member of group.members) {
            await FamilyMember.create({
                id: uuidv4(),
                family_id: group.family.id,
                user_id: member.id,
                role: member.id === group.owner.id ? 'owner' : 'member',
                joined_at: DEMO_BASE_DATE,
            });
        }
    }

    const demoFamilyWallets = await createWallets({
        owner: users.demo,
        family: demoFamily,
        balanceLedger,
        specs: [
            { name: 'Quỹ Ăn Uống Gia Đình', balance: 15000000 },
            { name: 'Quỹ Du Lịch Gia Đình', balance: 24000000 },
        ],
    });
    const officeFamilyWallets = await createWallets({
        owner: users.staff,
        family: officeFamily,
        balanceLedger,
        specs: [{ name: 'Quỹ Văn Phòng', balance: 18000000 }],
    });
    const adminFamilyWallets = await createWallets({
        owner: users.admin,
        family: adminFamily,
        balanceLedger,
        specs: [{ name: 'Quỹ Quản Trị Chung', balance: 36000000 }],
    });

    console.log('\n=== BUOC 6: Tao transactions thang 05/2026 ===');
    await seedPersonalTransactions({ user: users.demo, wallets: demoWallets, catMap, balanceLedger, count: 90, offset: 0, incomeEvery: 7 });
    await seedPersonalTransactions({ user: users.staff, wallets: staffWallets, catMap, balanceLedger, count: 48, offset: 9, incomeEvery: 6 });
    await seedPersonalTransactions({ user: users.admin, wallets: adminWallets, catMap, balanceLedger, count: 38, offset: 18, incomeEvery: 6 });
    await seedHistoricalTransactions({ user: users.demo, wallets: demoWallets, catMap, balanceLedger, count: 8, offset: 0 });
    await seedHistoricalTransactions({ user: users.staff, wallets: staffWallets, catMap, balanceLedger, count: 6, offset: 8 });
    await seedHistoricalTransactions({ user: users.admin, wallets: adminWallets, catMap, balanceLedger, count: 4, offset: 14 });
    await seedFamilyTransactions({ family: demoFamily, wallets: demoFamilyWallets, members: demoFamilyMembers, catMap, balanceLedger, count: 12, offset: 20 });
    await seedFamilyTransactions({ family: officeFamily, wallets: officeFamilyWallets, members: officeFamilyMembers, catMap, balanceLedger, count: 6, offset: 40 });
    await seedFamilyTransactions({ family: adminFamily, wallets: adminFamilyWallets, members: adminFamilyMembers, catMap, balanceLedger, count: 6, offset: 55 });
    await flushWalletBalances(balanceLedger);
    console.log('  176 giao dich ca nhan thang 05, 18 giao dich lich su, 24 giao dich family/shared da tao.');

    console.log('\n=== BUOC 7: Tao goals, budgets, recurring ===');
    await seedGoals(users.demo, 8);
    await seedGoals(users.staff, 5);
    await seedGoals(users.admin, 5);
    await seedBudgets({ user: users.demo, catMap, count: 8 });
    await seedBudgets({ user: users.staff, catMap, count: 5 });
    await seedBudgets({ user: users.admin, catMap, count: 4 });
    await seedBudgets({ family: demoFamily, catMap, count: 3 });
    await seedBudgets({ family: officeFamily, catMap, count: 2 });
    await seedBudgets({ family: adminFamily, catMap, count: 2 });
    await seedRecurring({ user: users.demo, wallets: demoWallets, catMap, count: 6, offset: 0 });
    await seedRecurring({ user: users.staff, wallets: staffWallets, catMap, count: 4, offset: 2 });
    await seedRecurring({ user: users.admin, wallets: adminWallets, catMap, count: 3, offset: 4 });
    console.log('  Goals/Budgets/Recurring da tao cho demo, staff, admin.');

    console.log('\n=== BUOC 8: Tao notifications va audit logs ===');
    await seedNotifications(users);
    await seedAuditLogs(users, families);
    console.log('  Notifications va audit logs demo da tao.');

    console.log('\n=== BUOC 9: Seed lich su gia vang demo ===');
    await seedGoldHistoryDemo();

    console.log('\n============================================');
    console.log('HOAN THANH! Tai khoan demo san sang:');
    console.log(`  Demo User : ${DEMO_EMAIL}   / ${DEMO_PASS}`);
    console.log(`  Staff     : ${STAFF_EMAIL}  / ${STAFF_PASS}`);
    console.log(`  Admin     : ${ADMIN_EMAIL}  / ${ADMIN_PASS}`);
    console.log('  12 users, 3 families, 15 wallets, 218 transactions, 18 goals, 24 budgets, 13 recurring patterns');
    console.log('============================================');

    await sequelize.close();
}

main().catch((error) => {
    console.error('LOI:', error);
    process.exit(1);
});
