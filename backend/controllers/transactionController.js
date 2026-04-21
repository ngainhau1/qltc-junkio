const { Transaction, Wallet, User, Category, sequelize } = require('../models');
const { randomUUID } = require('crypto');
const { Op, literal } = require('sequelize');
const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');
const { success, error: sendError } = require('../utils/responseHelper');
const { getAccessibleWalletIds, getAccessibleWallets } = require('../utils/accessScope');

const transferLocks = new Map();

const withTransferLock = async (walletId, task) => {
    const previous = transferLocks.get(walletId) || Promise.resolve();
    let releaseLock;

    const next = new Promise((resolve) => {
        releaseLock = resolve;
    });

    transferLocks.set(walletId, next);

    await previous;

    try {
        return await task();
    } finally {
        releaseLock();

        if (transferLocks.get(walletId) === next) {
            transferLocks.delete(walletId);
        }
    }
};

const buildTransactionWhere = ({ walletIds, filters }) => {
    const whereClause = {
        wallet_id: { [Op.in]: walletIds }
    };

    if (filters.startDate && filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        whereClause.date = { [Op.between]: [new Date(filters.startDate), end] };
    } else if (filters.startDate) {
        whereClause.date = { [Op.gte]: new Date(filters.startDate) };
    } else if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        whereClause.date = { [Op.lte]: end };
    }

    if (filters.type) whereClause.type = filters.type;
    if (filters.wallet_id) whereClause.wallet_id = filters.wallet_id;
    if (filters.category_id) whereClause.category_id = filters.category_id;
    if (filters.search) whereClause.description = { [Op.like]: `%${filters.search}%` };

    return whereClause;
};

const rollbackWalletForDeletedTransaction = (wallet, transaction) => {
    const amount = parseFloat(transaction.amount);

    if (transaction.type === 'INCOME' || transaction.type === 'TRANSFER_IN') {
        wallet.balance = parseFloat(wallet.balance) - amount;
        return;
    }

    wallet.balance = parseFloat(wallet.balance) + amount;
};

// GET /api/transactions/:id
exports.getTransactionById = async (req, res) => {
    try {
        const { id } = req.params;
        const { walletIds } = await getAccessibleWalletIds({ userId: req.user.id });

        const transaction = await Transaction.findOne({
            where: {
                id,
                wallet_id: { [Op.in]: walletIds }
            },
            include: [
                { model: Wallet, attributes: ['id', 'name'] },
                { model: Category, attributes: ['id', 'name'] },
                {
                    model: sequelize.models.TransactionShare,
                    as: 'Shares',
                    include: [{ model: User, as: 'User', attributes: ['id', 'name', 'email'] }]
                }
            ]
        });

        if (!transaction) {
            return sendError(res, 'TRANSACTION_NOT_FOUND', 404);
        }

        success(res, transaction, 'TRANSACTION_LOADED');
    } catch (err) {
        console.error('getTransactionById error:', err);
        sendError(res, 'TRANSACTION_LOAD_FAILED', 500);
    }
};

// GET /api/transactions
exports.getTransactions = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 50,
            startDate,
            endDate,
            type,
            search,
            wallet_id,
            category_id,
            context,
            family_id,
            sortBy = 'date',
            sortOrder = 'DESC'
        } = req.query;

        const { walletIds } = await getAccessibleWalletIds({
            userId: req.user.id,
            context,
            familyId: family_id
        });

        if (wallet_id && !walletIds.includes(wallet_id)) {
            return success(res, {
                transactions: [],
                totalItems: 0,
                totalPages: 0,
                currentPage: Number(page)
            }, 'TRANSACTIONS_LOADED');
        }

        const whereClause = buildTransactionWhere({
            walletIds,
            filters: { startDate, endDate, type, search, wallet_id, category_id }
        });

        const pageNum = Number(page);
        const perPage = Number(limit);
        const offset = (pageNum - 1) * perPage;

        // Build dynamic order clause
        const allowedSortFields = ['date', 'amount', 'type', 'created_at'];
        const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'date';
        const sortDir = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        const { count, rows } = await Transaction.findAndCountAll({
            where: whereClause,
            include: [
                { model: Wallet, attributes: ['id', 'name'] },
                { model: Category, attributes: ['id', 'name'] },
                { model: sequelize.models.TransactionShare, as: 'Shares' }
            ],
            order: [[sortField, sortDir]],
            limit: perPage,
            offset
        });

        success(res, {
            transactions: rows,
            totalItems: count,
            totalPages: Math.ceil(count / perPage),
            currentPage: pageNum
        }, 'TRANSACTIONS_LOADED');
    } catch (err) {
        console.error('getTransactions error:', err);
        sendError(res, 'TRANSACTIONS_LOAD_FAILED', 500);
    }
};

// POST /api/transactions
exports.createTransaction = async (req, res) => {
    const { wallet_id, category_id, amount, type, description, date, family_id, shares } = req.body;

    const t = await sequelize.transaction();
    try {
        const { wallets } = await getAccessibleWallets({
            userId: req.user.id,
            transaction: t
        });

        if (wallets.length === 0) {
            await t.rollback();
            return sendError(res, 'WALLET_REQUIRED', 400);
        }

        const wallet = wallets.find((accessibleWallet) => accessibleWallet.id === wallet_id) || null;
        if (!wallet) {
            await t.rollback();
            return sendError(res, 'WALLET_NOT_FOUND', 404);
        }

        const parsedAmount = parseFloat(amount);
        if (type === 'EXPENSE' && parseFloat(wallet.balance) < parsedAmount) {
            await t.rollback();
            return sendError(res, 'INSUFFICIENT_BALANCE', 400);
        }

        const transaction = await Transaction.create({
            user_id: req.user.id,
            wallet_id,
            category_id: category_id || null,
            amount: parsedAmount,
            type,
            description,
            date: date || new Date(),
            family_id: family_id || wallet.family_id || null
        }, { transaction: t });

        if (Array.isArray(shares) && shares.length > 0) {
            const sharesToCreate = shares.map((share) => ({
                transaction_id: transaction.id,
                user_id: share.user_id,
                amount: share.amount,
                status: share.status || 'UNPAID',
                approval_status: share.approval_status || 'APPROVED'
            }));
            await sequelize.models.TransactionShare.bulkCreate(sharesToCreate, { transaction: t });
        }

        wallet.balance = type === 'INCOME'
            ? parseFloat(wallet.balance) + parsedAmount
            : parseFloat(wallet.balance) - parsedAmount;
        await wallet.save({ transaction: t });

        await t.commit();
        success(res, transaction, 'TRANSACTION_CREATED', 201);
    } catch (err) {
        await t.rollback();
        console.error('createTransaction error:', err);
        sendError(res, 'TRANSACTION_CREATE_FAILED', 500);
    }
};

// DELETE /api/transactions/:id
exports.deleteTransaction = async (req, res) => {
    const { id } = req.params;
    const t = await sequelize.transaction();

    try {
        const { walletIds } = await getAccessibleWalletIds({
            userId: req.user.id,
            transaction: t
        });

        const transaction = await Transaction.findOne({
            where: {
                id,
                wallet_id: { [Op.in]: walletIds }
            },
            transaction: t
        });

        if (!transaction) {
            await t.rollback();
            return sendError(res, 'TRANSACTION_NOT_FOUND', 404);
        }

        const transactionsToDelete = transaction.transfer_group_id
            ? await Transaction.findAll({
                where: {
                    transfer_group_id: transaction.transfer_group_id,
                    wallet_id: { [Op.in]: walletIds }
                },
                transaction: t
            })
            : [transaction];

        if (transaction.transfer_group_id && transactionsToDelete.length !== 2) {
            await t.rollback();
            return sendError(res, 'TRANSFER_INCOMPLETE_PAIR', 409);
        }

        const walletIdsToUpdate = [...new Set(transactionsToDelete.map((item) => item.wallet_id))];
        const wallets = await Wallet.findAll({
            where: { id: { [Op.in]: walletIdsToUpdate } },
            transaction: t
        });
        const walletMap = new Map(wallets.map((wallet) => [wallet.id, wallet]));

        for (const item of transactionsToDelete) {
            const wallet = walletMap.get(item.wallet_id);
            if (!wallet) {
                continue;
            }

            rollbackWalletForDeletedTransaction(wallet, item);
            await item.destroy({ transaction: t });
        }

        for (const wallet of walletMap.values()) {
            await wallet.save({ transaction: t });
        }

        await t.commit();

        success(res, null, 'TRANSACTION_DELETED');
    } catch (err) {
        await t.rollback();
        console.error('deleteTransaction error:', err);
        sendError(res, 'TRANSACTION_DELETE_FAILED', 500);
    }
};

// POST /api/transactions/transfer
exports.createTransfer = async (req, res) => {
    const { from_wallet_id, to_wallet_id, amount, description, date } = req.body;

    return withTransferLock(from_wallet_id, async () => {
        const t = await sequelize.transaction();

        try {
            const parsedAmount = parseFloat(amount);
            const transferGroupId = randomUUID();
            const { wallets } = await getAccessibleWallets({
                userId: req.user.id,
                transaction: t
            });

            if (wallets.length === 0) {
                await t.rollback();
                return sendError(res, 'WALLET_REQUIRED', 400);
            }

            const fromWallet = wallets.find((wallet) => wallet.id === from_wallet_id) || null;
            if (!fromWallet) {
                await t.rollback();
                return sendError(res, 'WALLET_NOT_FOUND', 404);
            }

            const toWallet = wallets.find((wallet) => wallet.id === to_wallet_id) || null;
            if (!toWallet) {
                await t.rollback();
                return sendError(res, 'WALLET_NOT_FOUND', 404);
            }

            if (from_wallet_id === to_wallet_id) {
                await t.rollback();
                return sendError(res, 'TRANSFER_SAME_WALLET', 400);
            }

            if (parsedAmount <= 0) {
                await t.rollback();
                return sendError(res, 'INVALID_AMOUNT', 400);
            }
            if (parseFloat(fromWallet.balance) < parsedAmount) {
                await t.rollback();
                return sendError(res, 'INSUFFICIENT_BALANCE', 400);
            }

            const [debitedWalletCount] = await Wallet.update({
                balance: literal(`balance - ${parsedAmount}`),
            }, {
                where: {
                    id: from_wallet_id,
                    balance: {
                        [Op.gte]: parsedAmount,
                    },
                },
                transaction: t,
            });

            if (!debitedWalletCount) {
                await t.rollback();
                return sendError(res, 'INSUFFICIENT_BALANCE', 400);
            }

            await Wallet.update({
                balance: literal(`balance + ${parsedAmount}`),
            }, {
                where: { id: to_wallet_id },
                transaction: t,
            });

            const updatedFromWallet = await Wallet.findByPk(from_wallet_id, { transaction: t });
            const updatedToWallet = await Wallet.findByPk(to_wallet_id, { transaction: t });

            const transferOut = await Transaction.create({
                user_id: req.user.id,
                amount: parsedAmount,
                date: date || new Date(),
                description: description || `Chuyen tien toi vi ${toWallet.name}`,
                type: 'TRANSFER_OUT',
                wallet_id: from_wallet_id,
                family_id: fromWallet.family_id || null,
                transfer_group_id: transferGroupId
            }, { transaction: t });

            const transferIn = await Transaction.create({
                user_id: req.user.id,
                amount: parsedAmount,
                date: date || new Date(),
                description: description || `Nhan tien tu vi ${fromWallet.name}`,
                type: 'TRANSFER_IN',
                wallet_id: to_wallet_id,
                family_id: toWallet.family_id || null,
                transfer_group_id: transferGroupId
            }, { transaction: t });

            await t.commit();
            return success(res, {
                transfer_group_id: transferGroupId,
                transfer_out_id: transferOut.id,
                transfer_in_id: transferIn.id,
                from_wallet_balance: updatedFromWallet.balance,
                to_wallet_balance: updatedToWallet.balance
            }, 'TRANSFER_CREATED', 201);
        } catch (err) {
            if (!t.finished) {
                await t.rollback();
            }
            console.error('createTransfer error:', err);
            return sendError(res, 'TRANSFER_FAILED', 500);
        }
    });
};

// POST /api/transactions/import
exports.importTransactions = async (req, res) => {
    const { transactions } = req.body;
    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
        return sendError(res, 'INVALID_TRANSACTION_LIST', 400);
    }

    const t = await sequelize.transaction();

    try {
        const walletIds = [...new Set(transactions.map((tx) => tx.wallet_id))];
        const { wallets } = await getAccessibleWallets({
            userId: req.user.id,
            transaction: t
        });

        if (wallets.length === 0) {
            await t.rollback();
            return sendError(res, 'WALLET_REQUIRED', 400);
        }

        const walletMap = {};
        wallets
            .filter((wallet) => walletIds.includes(wallet.id))
            .forEach((wallet) => {
                walletMap[wallet.id] = wallet;
            });

        const transactionsToCreate = [];

        for (const tx of transactions) {
            const wallet = walletMap[tx.wallet_id];
            if (!wallet) continue;

            const parsedAmount = parseFloat(tx.amount);
            if (Number.isNaN(parsedAmount) || parsedAmount <= 0) continue;

            transactionsToCreate.push({
                user_id: req.user.id,
                wallet_id: tx.wallet_id,
                category_id: tx.category_id || null,
                amount: parsedAmount,
                type: tx.type === 'INCOME' ? 'INCOME' : 'EXPENSE',
                description: tx.description || 'Imported Transaction',
                date: tx.date ? new Date(tx.date) : new Date(),
                family_id: wallet.family_id || null
            });

            wallet.balance = tx.type === 'INCOME'
                ? parseFloat(wallet.balance) + parsedAmount
                : parseFloat(wallet.balance) - parsedAmount;
        }

        for (const wallet of Object.values(walletMap)) {
            await wallet.save({ transaction: t });
        }

        await Transaction.bulkCreate(transactionsToCreate, { transaction: t });
        await t.commit();

        success(res, { importedCount: transactionsToCreate.length }, 'IMPORT_SUCCESS');
    } catch (err) {
        await t.rollback();
        console.error('importTransactions error:', err);
        sendError(res, 'IMPORT_FAILED', 500);
    }
};

// GET /api/transactions/export
exports.exportTransactions = async (req, res) => {
    try {
        const {
            type,
            startDate,
            endDate,
            search,
            wallet_id,
            category_id,
            context,
            family_id,
            format = 'csv'
        } = req.query;

        const { walletIds } = await getAccessibleWalletIds({
            userId: req.user.id,
            context,
            familyId: family_id
        });

        const whereClause = buildTransactionWhere({
            walletIds,
            filters: { startDate, endDate, type, search, wallet_id, category_id }
        });

        const transactions = await Transaction.findAll({
            where: whereClause,
            include: [
                { model: Wallet, attributes: ['name'] },
                { model: Category, attributes: ['name'] }
            ],
            order: [['date', 'DESC']]
        });

        if (format === 'csv') {
            const fields = ['id', 'amount', 'type', 'description', 'date', 'Wallet.name', 'Category.name'];
            const parser = new Parser({ fields });
            const csv = parser.parse(transactions);

            res.header('Content-Type', 'text/csv');
            res.attachment('transactions.csv');
            return res.send(csv);
        }

        if (format === 'pdf') {
            const doc = new PDFDocument();
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename="transactions.pdf"');
            doc.pipe(res);

            doc.fontSize(16).text('BAO CAO GIAO DICH', { align: 'center' });
            doc.moveDown();

            transactions.forEach((tx) => {
                doc.fontSize(12).text(`Ngay: ${new Date(tx.date).toLocaleDateString('vi-VN')} | Loai: ${tx.type} | So tien: ${tx.amount}`);
                doc.text(`Vi: ${tx.Wallet ? tx.Wallet.name : 'N/A'} | Noi dung: ${tx.description}`);
                doc.moveDown(0.5);
                doc.rect(doc.x, doc.y, 400, 0.5).fill('#CCCCCC');
                doc.moveDown(0.5);
            });

            doc.end();
            return;
        }

        return sendError(res, 'EXPORT_FORMAT_UNSUPPORTED', 400);
    } catch (err) {
        console.error('exportTransactions error:', err);
        sendError(res, 'EXPORT_FAILED', 500);
    }
};
