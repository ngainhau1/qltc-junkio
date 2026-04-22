const { Op } = require('sequelize');
const { Transaction, Wallet, Category } = require('../models');
const { success, serverError } = require('../utils/responseHelper');
const { getAccessibleWallets, getAccessibleWalletIds } = require('../utils/accessScope');

const toNumber = (value) => Number(value || 0);

const buildDateWhere = (startDate, endDate) => {
    if (startDate && endDate) {
        return { date: { [Op.between]: [new Date(startDate), new Date(endDate)] } };
    }

    if (startDate) {
        return { date: { [Op.gte]: new Date(startDate) } };
    }

    if (endDate) {
        return { date: { [Op.lte]: new Date(endDate) } };
    }

    return {};
};

const buildCashflowSeries = (transactions) => {
    const grouped = transactions.reduce((accumulator, transaction) => {
        const sortKey = new Date(transaction.date).toISOString().split('T')[0];

        if (!accumulator[sortKey]) {
            accumulator[sortKey] = {
                date: sortKey,
                income: 0,
                expense: 0,
            };
        }

        if (transaction.type === 'INCOME' || transaction.type === 'TRANSFER_IN') {
            accumulator[sortKey].income += toNumber(transaction.amount);
        } else if (transaction.type === 'EXPENSE' || transaction.type === 'TRANSFER_OUT') {
            accumulator[sortKey].expense += toNumber(transaction.amount);
        }

        return accumulator;
    }, {});

    return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
};

const buildExpenseByCategory = (transactions) => {
    const grouped = transactions.reduce((accumulator, transaction) => {
        if (transaction.type !== 'EXPENSE') {
            return accumulator;
        }

        const key = transaction.Category?.name || transaction.category_id || 'Uncategorized';

        if (!accumulator[key]) {
            accumulator[key] = { name: key, value: 0 };
        }

        accumulator[key].value += toNumber(transaction.amount);
        return accumulator;
    }, {});

    return Object.values(grouped).sort((a, b) => b.value - a.value);
};

exports.getDashboardStats = async (req, res) => {
    try {
        const { context, family_id, startDate, endDate } = req.query;
        const userId = req.user.id;

        const { wallets } = await getAccessibleWallets({
            userId,
            context,
            familyId: family_id,
        });

        const walletIds = wallets.map((wallet) => wallet.id);
        const totalAssets = wallets.reduce((sum, wallet) => sum + toNumber(wallet.balance), 0);

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const currentMonthTransactions = await Transaction.findAll({
            where: {
                wallet_id: { [Op.in]: walletIds },
                date: { [Op.gte]: startOfMonth },
            },
        });

        const totalIncome = currentMonthTransactions
            .filter((transaction) => transaction.type === 'INCOME')
            .reduce((sum, transaction) => sum + toNumber(transaction.amount), 0);

        const totalExpense = currentMonthTransactions
            .filter((transaction) => transaction.type === 'EXPENSE')
            .reduce((sum, transaction) => sum + toNumber(transaction.amount), 0);

        const recentTransactions = await Transaction.findAll({
            where: { wallet_id: { [Op.in]: walletIds } },
            order: [['date', 'DESC']],
            limit: 5,
            include: [
                { model: Category, attributes: ['name', 'icon'] },
                { model: Wallet, attributes: ['id', 'name'] },
            ],
        });

        const cashflowTransactions = await Transaction.findAll({
            where: {
                wallet_id: { [Op.in]: walletIds },
                ...buildDateWhere(startDate, endDate),
            },
            order: [['date', 'ASC']],
        });

        return success(
            res,
            {
                stats: {
                    totalAssets,
                    totalIncome,
                    totalExpense,
                    activeWalletsCount: wallets.length,
                    transactionsThisMonthCount: currentMonthTransactions.length,
                },
                recentTransactions,
                cashflowSeries: buildCashflowSeries(cashflowTransactions),
            },
            'ANALYTICS_OVERVIEW_LOADED'
        );
    } catch (error) {
        console.error('Error fetching dashboard analytics:', error);
        return serverError(res, 'ANALYTICS_OVERVIEW_FAILED');
    }
};

exports.getReports = async (req, res) => {
    try {
        const { context, family_id, startDate, endDate, type, wallet_id, category_id } = req.query;
        const { walletIds } = await getAccessibleWalletIds({
            userId: req.user.id,
            context,
            familyId: family_id,
        });

        const where = {
            wallet_id: { [Op.in]: walletIds },
            ...buildDateWhere(startDate, endDate),
        };

        if (type) where.type = type;
        if (wallet_id) where.wallet_id = wallet_id;
        if (category_id) where.category_id = category_id;

        const transactions = await Transaction.findAll({
            where,
            include: [
                { model: Category, attributes: ['name', 'icon'] },
                { model: Wallet, attributes: ['id', 'name'] },
            ],
            order: [['date', 'ASC']],
        });

        const summary = {
            totalIncome: transactions
                .filter((transaction) => transaction.type === 'INCOME' || transaction.type === 'TRANSFER_IN')
                .reduce((sum, transaction) => sum + toNumber(transaction.amount), 0),
            totalExpense: transactions
                .filter((transaction) => transaction.type === 'EXPENSE' || transaction.type === 'TRANSFER_OUT')
                .reduce((sum, transaction) => sum + toNumber(transaction.amount), 0),
            transactionCount: transactions.length,
        };
        summary.net = summary.totalIncome - summary.totalExpense;

        return success(
            res,
            {
                summary,
                expenseByCategory: buildExpenseByCategory(transactions),
                cashflowSeries: buildCashflowSeries(transactions),
            },
            'ANALYTICS_REPORT_LOADED'
        );
    } catch (error) {
        console.error('Error fetching reports:', error);
        return serverError(res, 'ANALYTICS_REPORT_FAILED');
    }
};
