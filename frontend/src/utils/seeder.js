import { faker } from '@faker-js/faker';

export const generateMockData = (userId, familyId = null) => {
    // Generate Wallets
    const wallets = [];
    // Personal Wallets
    wallets.push({
        id: faker.string.uuid(),
        user_id: userId,
        family_id: null,
        name: 'Cash',
        type: 'CASH',
        balance: 0,
        currency: 'VND'
    });
    wallets.push({
        id: faker.string.uuid(),
        user_id: userId,
        family_id: null,
        name: 'Bank Account',
        type: 'BANK',
        balance: 0,
        currency: 'VND'
    });

    if (familyId) {
        wallets.push({
            id: faker.string.uuid(),
            user_id: null,
            family_id: familyId,
            name: 'Family Fund',
            type: 'BANK',
            balance: 0,
            currency: 'VND'
        });
    }

    // Generate Categories
    const categories = [
        { id: 'cat-1', name: 'Food & Dining', type: 'EXPENSE' },
        { id: 'cat-2', name: 'Transportation', type: 'EXPENSE' },
        { id: 'cat-3', name: 'Utilities', type: 'EXPENSE' },
        { id: 'cat-4', name: 'Shopping', type: 'EXPENSE' },
        { id: 'cat-5', name: 'Salary', type: 'INCOME' },
    ];

    // Generate Transactions
    const transactions = [];
    const walletIds = wallets.map(w => w.id);

    // Determine number of transactions (e.g., 1000)
    for (let i = 0; i < 1000; i++) {
        const isIncome = faker.datatype.boolean({ probability: 0.3 }); // 30% income
        const amount = parseFloat(faker.finance.amount({ min: 10000, max: 2000000, dec: 0 }));
        const walletId = faker.helpers.arrayElement(walletIds);
        const category = isIncome
            ? categories.find(c => c.type === 'INCOME')
            : faker.helpers.arrayElement(categories.filter(c => c.type === 'EXPENSE'));

        transactions.push({
            id: faker.string.uuid(),
            wallet_id: walletId,
            category_id: category.id,
            amount: amount,
            description: faker.commerce.productName(),
            transaction_date: faker.date.past({ years: 1 }).toISOString(),
            type: isIncome ? 'INCOME' : 'EXPENSE',
            user_id: userId,
        });

        // Update wallet balance mock
        const wallet = wallets.find(w => w.id === walletId);
        if (isIncome) {
            wallet.balance += amount;
        } else {
            wallet.balance -= amount;
        }
    }

    return { wallets, categories, transactions };
};
