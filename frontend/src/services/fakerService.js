import { faker } from '@faker-js/faker';

export const FakerService = {
    generateUser: () => ({
        id: faker.string.uuid(),
        name: faker.person.fullName(),
        email: faker.internet.email(),
        avatar: faker.image.avatar(),
        role: 'member'
    }),

    generateFamily: (ownerId, ownerName) => {
        const members = [
            { id: ownerId, name: ownerName, role: 'owner', joinedAt: new Date().toISOString() }
        ];

        // Add 2-3 random members
        const count = faker.number.int({ min: 2, max: 3 });
        for (let i = 0; i < count; i++) {
            members.push({
                id: faker.string.uuid(),
                name: faker.person.fullName(),
                role: 'member',
                joinedAt: faker.date.past().toISOString()
            });
        }

        return {
            id: faker.string.uuid(),
            name: `${faker.person.lastName()} Family`,
            owner_id: ownerId,
            members: members,
            createdAt: faker.date.past().toISOString()
        };
    },

    generateWallets: (userId) => {
        const wallets = [];
        // Cash Wallet
        wallets.push({
            id: faker.string.uuid(),
            name: 'Tiền Mặt',
            balance: parseFloat(faker.finance.amount({ min: 1000000, max: 20000000, dec: 0 })),
            currency: 'VND',
            type: 'CASH',
            user_id: userId
        });
        // Bank Wallet
        wallets.push({
            id: faker.string.uuid(),
            name: 'Techcombank',
            balance: parseFloat(faker.finance.amount({ min: 5000000, max: 100000000, dec: 0 })),
            currency: 'VND',
            type: 'BANK',
            user_id: userId
        });
        return wallets;
    },

    generateTransactions: (count = 1000, walletIds, categoryIds) => {
        const transactions = [];
        for (let i = 0; i < count; i++) {
            const isExpense = Math.random() > 0.3;
            const date = faker.date.between({ from: '2024-01-01', to: new Date() });

            transactions.push({
                id: faker.string.uuid(),
                amount: parseFloat(faker.finance.amount({ min: 10000, max: 2000000, dec: 0 })),
                date: date.toISOString(),
                description: isExpense ? faker.commerce.productName() : 'Lương / Thưởng',
                type: isExpense ? 'EXPENSE' : 'INCOME',
                wallet_id: faker.helpers.arrayElement(walletIds),
                category_id: faker.helpers.arrayElement(categoryIds),
                // Additional metadata for filtering
                monthKey: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
            });
        }
        return transactions.sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort DESC
    },

    initData: (existingUserId = null) => {
        const user = existingUserId
            ? { id: existingUserId, name: 'Demo User', role: 'member' }
            : FakerService.generateUser();

        const family = FakerService.generateFamily(user.id, user.name);
        const wallets = FakerService.generateWallets(user.id);

        const familyWalletId = faker.string.uuid();
        // Add a family wallet
        wallets.push({
            id: familyWalletId,
            name: 'Quỹ Gia Đình',
            balance: parseFloat(faker.finance.amount({ min: 10000000, max: 50000000, dec: 0 })),
            currency: 'VND',
            type: 'BANK',
            user_id: null,
            family_id: family.id
        });

        // Static Categories for consistency
        const categories = [
            { id: 'cat-1', name: 'Ăn uống', type: 'EXPENSE', icon: 'utensils' },
            { id: 'cat-2', name: 'Di chuyển', type: 'EXPENSE', icon: 'car' },
            { id: 'cat-3', name: 'Nhà cửa', type: 'EXPENSE', icon: 'home' },
            { id: 'cat-4', name: 'Giải trí', type: 'EXPENSE', icon: 'gamepad' },
            { id: 'cat-5', name: 'Lương', type: 'INCOME', icon: 'wallet' },
            { id: 'cat-6', name: 'Đầu tư', type: 'INCOME', icon: 'trending-up' },
        ];

        const walletIds = wallets.map(w => w.id);
        const categoryIds = categories.map(c => c.id);
        const memberIds = family.members.map(m => m.id);

        const transactions = [];
        for (let i = 0; i < 1000; i++) {
            const isExpense = Math.random() > 0.3;
            const date = faker.date.between({ from: '2024-01-01', to: new Date() });

            // Randomly pick a wallet
            const walletId = faker.helpers.arrayElement(walletIds);

            const amount = parseFloat(faker.finance.amount({ min: 10000, max: 2000000, dec: 0 }));

            // If wallet is family wallet, pick a random member as payer (user_id)
            let userId = user.id;
            let shares = [];

            if (walletId === familyWalletId) {
                userId = faker.helpers.arrayElement(memberIds);

                // Split logic: Equal split for simplicity
                const splitAmount = amount / memberIds.length;
                shares = memberIds.map(mId => ({
                    id: faker.string.uuid(),
                    user_id: mId,
                    amount: splitAmount,
                    status: 'PENDING'
                }));
            }

            transactions.push({
                id: faker.string.uuid(),
                amount: amount,
                date: date.toISOString(),
                description: isExpense ? faker.commerce.productName() : 'Lương / Thưởng',
                type: isExpense ? 'EXPENSE' : 'INCOME',
                wallet_id: walletId,
                category_id: faker.helpers.arrayElement(categoryIds),
                user_id: userId,
                shares: shares.length > 0 ? shares : undefined,
                // Additional metadata for filtering
                monthKey: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
            });
        }
        transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Generate Recurring Rules
        const recurringRules = []
        // 1. Rent (Monthly)
        recurringRules.push({
            id: faker.string.uuid(),
            name: 'Tiền Thuê Nhà',
            amount: 5000000,
            type: 'EXPENSE',
            frequency: 'MONTHLY',
            startDate: faker.date.past().toISOString(),
            nextDueDate: new Date().toISOString(), // Due now for testing
            walletId: walletIds[0], // Use first wallet
            categoryId: categoryIds[0], // Use first category
            active: true
        })

        // 2. Internet (Monthly)
        recurringRules.push({
            id: faker.string.uuid(),
            name: 'Internet FPT',
            amount: 300000,
            type: 'EXPENSE',
            frequency: 'MONTHLY',
            startDate: faker.date.past().toISOString(),
            nextDueDate: faker.date.future().toISOString(), // Due later
            walletId: walletIds[0],
            categoryId: categoryIds[2],
            active: true
        })

        // 3. Salary (Monthly Income)
        recurringRules.push({
            id: faker.string.uuid(),
            name: 'Lương Cơ Bản',
            amount: 20000000,
            type: 'INCOME',
            frequency: 'MONTHLY',
            startDate: faker.date.past().toISOString(),
            nextDueDate: new Date().toISOString(), // Due now
            walletId: walletIds[1] || walletIds[0],
            categoryId: categoryIds[4], // Salary category
            active: true
        })


        return { user, family, wallets, categories, transactions, recurringRules };
    }
};
