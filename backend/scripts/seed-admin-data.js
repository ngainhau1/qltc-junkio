const { User, Family, FamilyMember, Wallet, Category, Transaction, Goal, Budget, sequelize } = require('../models');
const { Op } = require('sequelize');

async function seedAdminData() {
    const email = process.argv[2] || 'admin@junkio.com';

    try {
        await sequelize.transaction(async (t) => {
            console.log(`Bắt đầu seed dữ liệu cho user: ${email}`);

            let user = await User.findOne({ where: { email }, transaction: t });
            if (!user) {
                console.log(`User ${email} không tồn tại! Hãy tạo bằng UI / Register trước.`);
                process.exit(1);
            }

            console.log('1. Lấy thông tin Family...');
            let familyMember = await FamilyMember.findOne({ where: { user_id: user.id, role: 'owner' }, transaction: t });
            let familyId = null;
            if (familyMember) {
                familyId = familyMember.family_id;
            } else {
                const newFam = await Family.create({ name: 'Admin Family', owner_id: user.id }, { transaction: t });
                familyId = newFam.id;
                await FamilyMember.create({ family_id: familyId, user_id: user.id, role: 'owner' }, { transaction: t });
            }

            console.log('2. Dọn dẹp dữ liệu cũ (Xoá data rác của tài khoản này)...');
            await Transaction.destroy({ where: { user_id: user.id }, transaction: t });
            await Wallet.destroy({ where: { user_id: user.id }, transaction: t });
            await Goal.destroy({ where: { user_id: user.id }, transaction: t });
            await Budget.destroy({ where: { family_id: familyId }, transaction: t });
            
            // Re-fetch transactions for family wallets to delete those as well
            const oldFamilyWallets = await Wallet.findAll({ where: { family_id: familyId }, transaction: t });
            if (oldFamilyWallets.length > 0) {
                await Transaction.destroy({ where: { wallet_id: { [Op.in]: oldFamilyWallets.map(w => w.id) } }, transaction: t });
                await Wallet.destroy({ where: { family_id: familyId }, transaction: t });
            }

            console.log('3. Khởi tạo Categories (nếu chưa có)...');
            const categoriesData = [
                { name: 'Lương', type: 'income', icon: '💰' },
                { name: 'Thưởng', type: 'income', icon: '🎁' },
                { name: 'Ăn Uống', type: 'expense', icon: '🍔' },
                { name: 'Di Chuyển', type: 'expense', icon: '🚗' },
                { name: 'Hóa Đơn', type: 'expense', icon: '💡' },
                { name: 'Mua Sắm', type: 'expense', icon: '🛍️' },
                { name: 'Sức Khỏe', type: 'expense', icon: '❤️' }
            ];
            const categories = {};
            for (let cData of categoriesData) {
                const [cat] = await Category.findOrCreate({
                    where: { name: cData.name, type: cData.type },
                    defaults: cData,
                    transaction: t
                });
                categories[cData.name] = cat.id;
            }

            console.log('4. Tạo Ví (Wallets)...');
            const personalWallet = await Wallet.create({
                name: 'Ví Cá Nhân', balance: 5000000, currency: 'VND', user_id: user.id
            }, { transaction: t });
            
            const bankWallet = await Wallet.create({
                name: 'Tài Khoản VCB', balance: 45000000, currency: 'VND', user_id: user.id
            }, { transaction: t });

            const familyWallet = await Wallet.create({
                name: 'Quỹ Gia Đình', balance: 15000000, currency: 'VND', family_id: familyId
            }, { transaction: t });

            const wallets = [personalWallet.id, bankWallet.id, familyWallet.id];

            console.log('5. Tạo mục tiêu & ngân sách...');
            await Goal.create({
                name: 'Sắm Mac M4', targetAmount: 50000000, currentAmount: 15000000, deadline: new Date('2026-12-31'),
                colorCode: '#ff5722', imageUrl: 'Target', user_id: user.id
            }, { transaction: t });
            
            await Goal.create({
                name: 'Đổi Xe Máy', targetAmount: 70000000, currentAmount: 5500000, deadline: new Date('2026-08-31'),
                colorCode: '#3b82f6', imageUrl: 'Target', user_id: user.id
            }, { transaction: t });

            await Budget.create({
                amount_limit: 10000000, start_date: new Date('2026-03-01'), end_date: new Date('2026-03-31'),
                category_id: categories['Ăn Uống'], family_id: familyId
            }, { transaction: t });
            
            await Budget.create({
                amount_limit: 5000000, start_date: new Date('2026-03-01'), end_date: new Date('2026-03-31'),
                category_id: categories['Mua Sắm'], family_id: familyId
            }, { transaction: t });

            console.log('6. Tạo 40 giao dịch ngẫu nhiên...');
            const transactionsToCreate = [];
            const currentDate = new Date();
            
            for (let i = 0; i < 40; i++) {
                // Random date within last 60 days
                const tDate = new Date(currentDate.getTime() - Math.floor(Math.random() * 60 * 24 * 60 * 60 * 1000));
                
                // 30% income, 70% expense
                const isIncome = Math.random() < 0.3;
                let cName, type, amount;

                if (isIncome) {
                    cName = Math.random() < 0.8 ? 'Lương' : 'Thưởng';
                    type = 'income';
                    amount = Math.floor(Math.random() * 20 + 5) * 1000000; // 5M - 25M
                } else {
                    const expenseCats = ['Ăn Uống', 'Di Chuyển', 'Hóa Đơn', 'Mua Sắm', 'Sức Khỏe'];
                    cName = expenseCats[Math.floor(Math.random() * expenseCats.length)];
                    type = 'expense';
                    amount = Math.floor(Math.random() * 1000 + 50) * 1000; // 50K - 1M
                }

                transactionsToCreate.push({
                    amount,
                    type,
                    description: `Chi tiêu ${cName} ${i+1}`,
                    date: tDate,
                    category_id: categories[cName],
                    wallet_id: wallets[Math.floor(Math.random() * wallets.length)],
                    user_id: user.id
                });
            }

            await Transaction.bulkCreate(transactionsToCreate, { transaction: t });

            console.log('=> Hoàn tất nạp dữ liệu ảo (Mock Data)!');
        });
        process.exit(0);
    } catch (err) {
        console.error('Lỗi trong quá trình Seed data:', err);
        process.exit(1);
    }
}

seedAdminData();
