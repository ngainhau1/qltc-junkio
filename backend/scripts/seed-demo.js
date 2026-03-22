'use strict';
/**
 * Script tạo 3 tài khoản demo:
 *   - demo@junkio.com   / demo123   (member, 50 giao dịch mẫu)
 *   - staff@junkio.com  / staff123  (staff)
 *   - admin@junkio.com  / admin123  (admin)
 *
 * Chạy: node scripts/seed-demo.js
 */

const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const { sequelize, User, Family, FamilyMember, Wallet, Category, Transaction, Budget, Goal } = require('../models');

const DEMO_EMAIL  = 'demo@junkio.com';
const DEMO_PASS   = 'demo123';
const STAFF_EMAIL = 'staff@junkio.com';
const STAFF_PASS  = 'staff123';
const ADMIN_EMAIL = 'admin@junkio.com';
const ADMIN_PASS  = 'admin123';

// ── Dữ liệu mẫu phong phú ──────────────────────────────────────────────────
const CATEGORIES = [
    { name: 'Ăn uống',      type: 'EXPENSE' },
    { name: 'Di chuyển',    type: 'EXPENSE' },
    { name: 'Nhà cửa',      type: 'EXPENSE' },
    { name: 'Giải trí',     type: 'EXPENSE' },
    { name: 'Mua sắm',      type: 'EXPENSE' },
    { name: 'Sức khỏe',     type: 'EXPENSE' },
    { name: 'Giáo dục',     type: 'EXPENSE' },
    { name: 'Dịch vụ số',   type: 'EXPENSE' },
    { name: 'Lương',         type: 'INCOME'  },
    { name: 'Thưởng',        type: 'INCOME'  },
    { name: 'Đầu tư',        type: 'INCOME'  },
    { name: 'Thu nhập phụ',  type: 'INCOME'  },
];

// 50 giao dịch mẫu đa dạng (50 dòng)
const RAW_TRANSACTIONS = [
    // INCOME (10 khoản)
    { desc: 'Lương tháng 3/2026',           amount: 15000000, type: 'INCOME',  cat: 'Lương',        daysAgo: 3  },
    { desc: 'Thưởng hoàn thành dự án',       amount:  4200000, type: 'INCOME',  cat: 'Thưởng',       daysAgo: 5  },
    { desc: 'Cổ tức quý 1',                  amount:  2100000, type: 'INCOME',  cat: 'Đầu tư',       daysAgo: 7  },
    { desc: 'Freelance thiết kế logo',        amount:  1500000, type: 'INCOME',  cat: 'Thu nhập phụ', daysAgo: 10 },
    { desc: 'Bán đồ cũ Shopee',              amount:   650000, type: 'INCOME',  cat: 'Thu nhập phụ', daysAgo: 12 },
    { desc: 'Lương tháng 2/2026',            amount: 15000000, type: 'INCOME',  cat: 'Lương',        daysAgo: 34 },
    { desc: 'Thưởng Tết',                    amount:  6000000, type: 'INCOME',  cat: 'Thưởng',       daysAgo: 38 },
    { desc: 'Cho thuê xe đạp cuối tuần',     amount:   300000, type: 'INCOME',  cat: 'Thu nhập phụ', daysAgo: 15 },
    { desc: 'Lợi nhuận trading',             amount:   980000, type: 'INCOME',  cat: 'Đầu tư',       daysAgo: 20 },
    { desc: 'Hoa hồng giới thiệu khóa học',  amount:   450000, type: 'INCOME',  cat: 'Thu nhập phụ', daysAgo: 22 },

    // EXPENSE — Ăn uống (10 khoản)
    { desc: 'Bữa tối gia đình Nhà Hàng Sài Gòn', amount: 580000, type: 'EXPENSE', cat: 'Ăn uống', daysAgo: 1  },
    { desc: 'Cà phê sáng The Coffee House',        amount:  65000, type: 'EXPENSE', cat: 'Ăn uống', daysAgo: 2  },
    { desc: 'Giao đồ ăn Grab – trưa VP',          amount: 85000,  type: 'EXPENSE', cat: 'Ăn uống', daysAgo: 4  },
    { desc: 'Siêu thị Co.opmart cuối tuần',        amount: 720000, type: 'EXPENSE', cat: 'Ăn uống', daysAgo: 6  },
    { desc: 'Phở bò buổi sáng',                   amount: 55000,  type: 'EXPENSE', cat: 'Ăn uống', daysAgo: 8  },
    { desc: 'Trà sữa Gong Cha',                   amount: 75000,  type: 'EXPENSE', cat: 'Ăn uống', daysAgo: 9  },
    { desc: 'Tiệc sinh nhật bạn bè',              amount: 480000, type: 'EXPENSE', cat: 'Ăn uống', daysAgo: 11 },
    { desc: 'Mì cay 7 cấp độ – Haidilao',        amount: 320000, type: 'EXPENSE', cat: 'Ăn uống', daysAgo: 14 },
    { desc: 'Bánh mì ốp la buổi sáng',            amount: 30000,  type: 'EXPENSE', cat: 'Ăn uống', daysAgo: 16 },
    { desc: 'Siêu thị tháng 2',                   amount: 850000, type: 'EXPENSE', cat: 'Ăn uống', daysAgo: 36 },

    // EXPENSE — Di chuyển (5)
    { desc: 'Xăng xe máy tuần này',     amount: 130000, type: 'EXPENSE', cat: 'Di chuyển', daysAgo: 3  },
    { desc: 'Grab đến sân bay',         amount: 250000, type: 'EXPENSE', cat: 'Di chuyển', daysAgo: 18 },
    { desc: 'Vé xe khách đi Đà Lạt',   amount: 180000, type: 'EXPENSE', cat: 'Di chuyển', daysAgo: 25 },
    { desc: 'Đổ xăng ô tô',            amount: 520000, type: 'EXPENSE', cat: 'Di chuyển', daysAgo: 29 },
    { desc: 'Phí cầu đường tháng 3',   amount:  90000, type: 'EXPENSE', cat: 'Di chuyển', daysAgo: 33 },

    // EXPENSE — Nhà cửa (5)
    { desc: 'Tiền thuê nhà tháng 3',   amount: 4500000, type: 'EXPENSE', cat: 'Nhà cửa', daysAgo: 3  },
    { desc: 'Hóa đơn điện tháng 2',    amount:  780000, type: 'EXPENSE', cat: 'Nhà cửa', daysAgo: 35 },
    { desc: 'Hóa đơn nước',            amount:  120000, type: 'EXPENSE', cat: 'Nhà cửa', daysAgo: 20 },
    { desc: 'Internet FPT tháng 3',    amount:  220000, type: 'EXPENSE', cat: 'Nhà cửa', daysAgo: 4  },
    { desc: 'Mua đèn LED thay thế',    amount:  350000, type: 'EXPENSE', cat: 'Nhà cửa', daysAgo: 17 },

    // EXPENSE — Mua sắm (5)
    { desc: 'Quần Jean Levi\'s sale',  amount:  890000, type: 'EXPENSE', cat: 'Mua sắm', daysAgo: 13 },
    { desc: 'Giày thể thao Nike',      amount: 1650000, type: 'EXPENSE', cat: 'Mua sắm', daysAgo: 21 },
    { desc: 'Tai nghe Bluetooth',      amount:  450000, type: 'EXPENSE', cat: 'Mua sắm', daysAgo: 28 },
    { desc: 'Tủ nhỏ IKEA',            amount:  990000, type: 'EXPENSE', cat: 'Mua sắm', daysAgo: 32 },
    { desc: 'Sách kỹ năng mềm',       amount:  185000, type: 'EXPENSE', cat: 'Mua sắm', daysAgo: 40 },

    // EXPENSE — Giải trí (5)
    { desc: 'Vé xem phim CGV',        amount:  120000, type: 'EXPENSE', cat: 'Giải trí', daysAgo: 8  },
    { desc: 'Netflix tháng 3',        amount:  260000, type: 'EXPENSE', cat: 'Dịch vụ số', daysAgo: 5  },
    { desc: 'Spotify Premium',        amount:   59000, type: 'EXPENSE', cat: 'Dịch vụ số', daysAgo: 5  },
    { desc: 'Vé concert Đen Vâu',     amount:  800000, type: 'EXPENSE', cat: 'Giải trí', daysAgo: 26 },
    { desc: 'Game Steam mùa sale',    amount:  350000, type: 'EXPENSE', cat: 'Giải trí', daysAgo: 30 },

    // EXPENSE — Sức khỏe (5)
    { desc: 'Khám sức khỏe định kỳ',  amount:  450000, type: 'EXPENSE', cat: 'Sức khỏe', daysAgo: 19 },
    { desc: 'Mua thuốc cảm cúm',      amount:   85000, type: 'EXPENSE', cat: 'Sức khỏe', daysAgo: 7  },
    { desc: 'Gym tháng 3',            amount:  350000, type: 'EXPENSE', cat: 'Sức khỏe', daysAgo: 3  },
    { desc: 'Vitamin tổng hợp DHC',   amount:  280000, type: 'EXPENSE', cat: 'Sức khỏe', daysAgo: 24 },
    { desc: 'Tiêm vaccine cúm',       amount:  250000, type: 'EXPENSE', cat: 'Sức khỏe', daysAgo: 42 },

    // EXPENSE — Giáo dục (5)
    { desc: 'Khóa học Udemy – React',           amount:  299000, type: 'EXPENSE', cat: 'Giáo dục', daysAgo: 10 },
    { desc: 'Học phí tiếng Anh tháng 3',        amount: 1200000, type: 'EXPENSE', cat: 'Giáo dục', daysAgo: 4  },
    { desc: 'Sách giáo trình Design Patterns',  amount:  165000, type: 'EXPENSE', cat: 'Giáo dục', daysAgo: 27 },
    { desc: 'Đóng phí thi IELTS',               amount: 4700000, type: 'EXPENSE', cat: 'Giáo dục', daysAgo: 45 },
    { desc: 'Mua khóa SQL nâng cao',            amount:  350000, type: 'EXPENSE', cat: 'Giáo dục', daysAgo: 35 },
];

// ── Hàm tiện ích ────────────────────────────────────────────────────────────
function daysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d;
}

async function deleteIfExists(email) {
    const user = await User.findOne({ where: { email } });
    if (user) {
        console.log(`  => Xoa tai khoan cu: ${email}`);
        await Transaction.destroy({ where: { user_id: user.id } });
        await Goal.destroy({ where: { user_id: user.id } });
        await Budget.destroy({ where: {} }); // Budgets gắn family
        await FamilyMember.destroy({ where: { user_id: user.id } });
        const ownedFamilies = await Family.findAll({ where: { owner_id: user.id } });
        for (const f of ownedFamilies) {
            await FamilyMember.destroy({ where: { family_id: f.id } });
            await Wallet.destroy({ where: { family_id: f.id } });
            await Family.destroy({ where: { id: f.id } });
        }
        await Wallet.destroy({ where: { user_id: user.id } });
        await user.destroy();
    }
}

async function main() {
    await sequelize.authenticate();
    console.log('DB ket noi thanh cong.\n');

    // ── 1. Xóa tài khoản cũ nếu có ─────────────────────────────────────────
    console.log('=== BUOC 1: Don dep tai khoan cu ===');
    await deleteIfExists(DEMO_EMAIL);
    await deleteIfExists(STAFF_EMAIL);
    await deleteIfExists(ADMIN_EMAIL);

    // ── 2. Tạo categories (dùng chung) ──────────────────────────────────────
    console.log('\n=== BUOC 2: Tao Categories ===');
    const catMap = {};
    for (const c of CATEGORIES) {
        const [cat] = await Category.findOrCreate({
            where: { name: c.name, type: c.type },
            defaults: { id: uuidv4(), name: c.name, type: c.type }
        });
        catMap[c.name] = cat.id;
        console.log(`  [cat] ${c.type} - ${c.name}`);
    }

    // ── 3. Tạo Admin ─────────────────────────────────────────────────────────
    console.log('\n=== BUOC 3: Tao Admin ===');
    const adminPwHash = await bcrypt.hash(ADMIN_PASS, 10);
    const admin = await User.create({
        id: uuidv4(), name: 'Junkio Admin', email: ADMIN_EMAIL,
        password_hash: adminPwHash, role: 'admin', is_locked: false
    });
    console.log(`  Admin: ${ADMIN_EMAIL} / ${ADMIN_PASS}`);

    // Ví cho admin
    await Wallet.create({
        id: uuidv4(), name: 'Ví Admin', balance: 50000000,
        currency: 'VND', user_id: admin.id, family_id: null
    });

    // ── 4. Tạo Demo User ─────────────────────────────────────────────────────
    console.log('\n=== BUOC 4: Tao Demo User ===');
    const demoPwHash = await bcrypt.hash(DEMO_PASS, 10);
    const demoUser = await User.create({
        id: uuidv4(), name: 'Nguyen Van Demo', email: DEMO_EMAIL,
        password_hash: demoPwHash, role: 'member', is_locked: false
    });
    console.log(`  Demo: ${DEMO_EMAIL} / ${DEMO_PASS}`);

    // Ví chính
    const wallet1 = await Wallet.create({
        id: uuidv4(), name: 'Ví Tiền Mặt', balance: 5000000,
        currency: 'VND', user_id: demoUser.id, family_id: null
    });
    const wallet2 = await Wallet.create({
        id: uuidv4(), name: 'Thẻ Ngân Hàng', balance: 20000000,
        currency: 'VND', user_id: demoUser.id, family_id: null
    });

    // ── 4b. Tạo Staff
    console.log('\n=== BUOC 4b: Tao Staff User ===');
    const staffPwHash = await bcrypt.hash(STAFF_PASS, 10);
    const staffUser = await User.create({
        id: uuidv4(), name: 'Tran Thi Staff', email: STAFF_EMAIL,
        password_hash: staffPwHash, role: 'staff', is_locked: false
    });
    const staffWallet = await Wallet.create({
        id: uuidv4(), name: 'Ví Staff', balance: 3500000,
        currency: 'VND', user_id: staffUser.id, family_id: null
    });
    console.log(`  Staff: ${STAFF_EMAIL} / ${STAFF_PASS}`);

    // ── 5. Tạo Family ────────────────────────────────────────────────────────
    console.log('\n=== BUOC 5: Tao Family ===');
    const family = await Family.create({
        id: uuidv4(), name: 'Gia Đình Demo', owner_id: demoUser.id
    });
    await FamilyMember.create({
        id: uuidv4(), family_id: family.id, user_id: demoUser.id, role: 'owner'
    });
    await FamilyMember.create({
        id: uuidv4(), family_id: family.id, user_id: admin.id, role: 'member'
    });
    await FamilyMember.create({
        id: uuidv4(), family_id: family.id, user_id: staffUser.id, role: 'member'
    });
    console.log(`  Family: ${family.name}`);

    // ── 6. Tạo 50 Transactions ───────────────────────────────────────────────
    console.log('\n=== BUOC 6: Tao 50 Transactions ===');
    let walletBalance1 = 5000000;
    let walletBalance2 = 20000000;
    const wallets = [wallet1, wallet2];

    for (let i = 0; i < RAW_TRANSACTIONS.length; i++) {
        const raw = RAW_TRANSACTIONS[i];
        const catId = catMap[raw.cat];
        const wallet = wallets[i % 2]; // Xen kẽ 2 ví

        await Transaction.create({
            id: uuidv4(),
            user_id: demoUser.id,
            wallet_id: wallet.id,
            category_id: catId || null,
            amount: raw.amount,
            type: raw.type,
            description: raw.desc,
            date: daysAgo(raw.daysAgo),
            transaction_date: daysAgo(raw.daysAgo),
            family_id: null
        });

        // Cập nhật balance theo chiều
        if (wallet.id === wallet1.id) {
            walletBalance1 += raw.type === 'INCOME' ? raw.amount : -raw.amount;
        } else {
            walletBalance2 += raw.type === 'INCOME' ? raw.amount : -raw.amount;
        }

        process.stdout.write(`  [${i + 1}/50] ${raw.type.padEnd(7)} ${raw.desc.substring(0, 40)}\n`);
    }

    // Cập nhật số dư ví thực tế
    await wallet1.update({ balance: Math.max(0, walletBalance1) });
    await wallet2.update({ balance: Math.max(0, walletBalance2) });

    // ── 7. Tạo Goals ─────────────────────────────────────────────────────────
    console.log('\n=== BUOC 7: Tao Goals ===');
    await Goal.bulkCreate([
        {
            id: uuidv4(), name: 'Mua xe máy Honda Wave', user_id: demoUser.id,
            targetAmount: 18000000, currentAmount: 6500000,
            deadline: daysAgo(-120), colorCode: '#3b82f6', imageUrl: 'Bike', status: 'IN_PROGRESS'
        },
        {
            id: uuidv4(), name: 'Quỹ du lịch Đà Nẵng', user_id: demoUser.id,
            targetAmount: 10000000, currentAmount: 3200000,
            deadline: daysAgo(-90), colorCode: '#22c55e', imageUrl: 'Plane', status: 'IN_PROGRESS'
        },
        {
            id: uuidv4(), name: 'Dự phòng khẩn cấp 6 tháng', user_id: demoUser.id,
            targetAmount: 30000000, currentAmount: 12000000,
            deadline: null, colorCode: '#f59e0b', imageUrl: 'Shield', status: 'IN_PROGRESS'
        }
    ], { individualHooks: false });
    console.log('  3 goals da tao.');

    // ── 8. Tạo Budgets ───────────────────────────────────────────────────────
    console.log('\n=== BUOC 8: Tao Budgets ===');
    const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const lastDay  = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
    await Budget.bulkCreate([
        { id: uuidv4(), amount_limit: 4000000, start_date: firstDay, end_date: lastDay, category_id: catMap['Ăn uống'],    family_id: null },
        { id: uuidv4(), amount_limit: 1000000, start_date: firstDay, end_date: lastDay, category_id: catMap['Giải trí'],   family_id: null },
        { id: uuidv4(), amount_limit: 2000000, start_date: firstDay, end_date: lastDay, category_id: catMap['Mua sắm'],    family_id: null },
        { id: uuidv4(), amount_limit: 1500000, start_date: firstDay, end_date: lastDay, category_id: catMap['Di chuyển'], family_id: null },
    ]);
    console.log('  4 budgets da tao.');

    // ── Done ─────────────────────────────────────────────────────────────────
    console.log('\n============================================');
    console.log('HOAN THANH! Tai khoan demo san sang:');
    console.log('  Demo User : demo@junkio.com   / demo123');
    console.log('  Staff     : staff@junkio.com  / staff123');
    console.log('  Admin     : admin@junkio.com  / admin123');
    console.log('  50 giao dich, 3 goals, 4 budgets, 3 vi ca nhan + 1 family');
    console.log('============================================');

    await sequelize.close();
}

main().catch(e => {
    console.error('LOI:', e.message);
    process.exit(1);
});
