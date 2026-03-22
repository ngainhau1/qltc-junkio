const { Transaction, Wallet, User, Category, sequelize } = require('../models');
const { Op } = require('sequelize');
const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');
const { success, error: sendError } = require('../utils/responseHelper');
const { getAccessibleWalletIds, getAccessibleWallets } = require('../utils/accessScope');

const buildTransactionWhere = ({ walletIds, filters }) => {
    const whereClause = {
        wallet_id: { [Op.in]: walletIds }
    };

    if (filters.startDate && filters.endDate) {
        whereClause.date = { [Op.between]: [new Date(filters.startDate), new Date(filters.endDate)] };
    } else if (filters.startDate) {
        whereClause.date = { [Op.gte]: new Date(filters.startDate) };
    } else if (filters.endDate) {
        whereClause.date = { [Op.lte]: new Date(filters.endDate) };
    }

    if (filters.type) whereClause.type = filters.type;
    if (filters.wallet_id) whereClause.wallet_id = filters.wallet_id;
    if (filters.category_id) whereClause.category_id = filters.category_id;
    if (filters.search) whereClause.description = { [Op.like]: `%${filters.search}%` };

    return whereClause;
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
            return sendError(res, 'Giao dich khong ton tai', 404);
        }

        success(res, transaction, 'Lay thong tin giao dich thanh cong');
    } catch (err) {
        console.error('getTransactionById error:', err);
        sendError(res, 'Loi lay chi tiet giao dich', 500);
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
            family_id
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
            }, 'Lay danh sach thanh cong');
        }

        const whereClause = buildTransactionWhere({
            walletIds,
            filters: { startDate, endDate, type, search, wallet_id, category_id }
        });

        const pageNum = Number(page);
        const perPage = Number(limit);
        const offset = (pageNum - 1) * perPage;

        const { count, rows } = await Transaction.findAndCountAll({
            where: whereClause,
            include: [
                { model: Wallet, attributes: ['id', 'name'] },
                { model: Category, attributes: ['id', 'name'] },
                { model: sequelize.models.TransactionShare, as: 'Shares' }
            ],
            order: [['date', 'DESC']],
            limit: perPage,
            offset
        });

        success(res, {
            transactions: rows,
            totalItems: count,
            totalPages: Math.ceil(count / perPage),
            currentPage: pageNum
        }, 'Lay danh sach thanh cong');
    } catch (err) {
        console.error('getTransactions error:', err);
        sendError(res, 'Loi lay danh sach giao dich', 500);
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
            return sendError(res, 'Vui long tao it nhat 1 vi truoc khi tao giao dich', 400);
        }

        const wallet = wallets.find((accessibleWallet) => accessibleWallet.id === wallet_id) || null;
        if (!wallet) {
            await t.rollback();
            return sendError(res, 'Vi khong ton tai hoac ban khong co quyen truy cap', 404);
        }

        const parsedAmount = parseFloat(amount);
        if (type === 'EXPENSE' && parseFloat(wallet.balance) < parsedAmount) {
            await t.rollback();
            return sendError(res, 'So du vi khong du', 400);
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
                approval_status: share.approval_status || 'PENDING'
            }));
            await sequelize.models.TransactionShare.bulkCreate(sharesToCreate, { transaction: t });
        }

        wallet.balance = type === 'INCOME'
            ? parseFloat(wallet.balance) + parsedAmount
            : parseFloat(wallet.balance) - parsedAmount;
        await wallet.save({ transaction: t });

        await t.commit();
        success(res, transaction, 'Tao giao dich thanh cong', 201);
    } catch (err) {
        await t.rollback();
        console.error('createTransaction error:', err);
        sendError(res, `Loi tao giao dich: ${err.message}`, 500);
    }
};

// DELETE /api/transactions/:id
exports.deleteTransaction = async (req, res) => {
    const { id } = req.params;
    const t = await sequelize.transaction();

    try {
        const transaction = await Transaction.findOne({
            where: { id, user_id: req.user.id },
            transaction: t
        });

        if (!transaction) {
            await t.rollback();
            return sendError(res, 'Giao dich khong ton tai hoac ban khong co quyen', 404);
        }

        const wallet = await Wallet.findByPk(transaction.wallet_id, { transaction: t });
        if (wallet) {
            if (transaction.type === 'INCOME') {
                wallet.balance = parseFloat(wallet.balance) - parseFloat(transaction.amount);
            } else {
                wallet.balance = parseFloat(wallet.balance) + parseFloat(transaction.amount);
            }
            await wallet.save({ transaction: t });
        }

        await transaction.destroy({ transaction: t });
        await t.commit();

        success(res, null, 'Xoa giao dich thanh cong');
    } catch (err) {
        await t.rollback();
        console.error('deleteTransaction error:', err);
        sendError(res, `Loi xoa giao dich: ${err.message}`, 500);
    }
};

// POST /api/transactions/transfer
exports.createTransfer = async (req, res) => {
    const { from_wallet_id, to_wallet_id, amount, description, date } = req.body;

    const t = await sequelize.transaction();
    try {
        const parsedAmount = parseFloat(amount);
        const { wallets } = await getAccessibleWallets({
            userId: req.user.id,
            transaction: t
        });

        if (wallets.length === 0) {
            await t.rollback();
            return sendError(res, 'Vui long tao it nhat 1 vi truoc khi chuyen tien', 400);
        }

        const fromWallet = wallets.find((wallet) => wallet.id === from_wallet_id) || null;
        if (!fromWallet) {
            await t.rollback();
            return sendError(res, 'Vi nguon khong ton tai hoac ban khong co quyen truy cap', 404);
        }

        const toWallet = wallets.find((wallet) => wallet.id === to_wallet_id) || null;
        if (!toWallet) {
            await t.rollback();
            return sendError(res, 'Vi dich khong ton tai hoac ban khong co quyen truy cap', 404);
        }

        if (parsedAmount <= 0) {
            await t.rollback();
            return sendError(res, 'So tien chuyen phai lon hon 0', 400);
        }
        if (parseFloat(fromWallet.balance) < parsedAmount) {
            await t.rollback();
            return sendError(res, 'So du vi nguon khong du', 400);
        }

        fromWallet.balance = parseFloat(fromWallet.balance) - parsedAmount;
        toWallet.balance = parseFloat(toWallet.balance) + parsedAmount;
        await fromWallet.save({ transaction: t });
        await toWallet.save({ transaction: t });

        await Transaction.create({
            user_id: req.user.id,
            amount: parsedAmount,
            date: date || new Date(),
            description: description || `Chuyen tien toi vi ${toWallet.name}`,
            type: 'TRANSFER_OUT',
            wallet_id: from_wallet_id,
            family_id: fromWallet.family_id || null
        }, { transaction: t });

        await Transaction.create({
            user_id: req.user.id,
            amount: parsedAmount,
            date: date || new Date(),
            description: description || `Nhan tien tu vi ${fromWallet.name}`,
            type: 'TRANSFER_IN',
            wallet_id: to_wallet_id,
            family_id: toWallet.family_id || null
        }, { transaction: t });

        await t.commit();
        success(res, {
            from_wallet_balance: fromWallet.balance,
            to_wallet_balance: toWallet.balance
        }, 'Chuyen tien thanh cong');
    } catch (err) {
        await t.rollback();
        console.error('createTransfer error:', err);
        sendError(res, `Loi giao dich chuyen tien: ${err.message}`, 500);
    }
};

// POST /api/transactions/import
exports.importTransactions = async (req, res) => {
    const { transactions } = req.body;
    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
        return sendError(res, 'Danh sach giao dich khong hop le', 400);
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
            return sendError(res, 'Vui long tao it nhat 1 vi truoc khi nhap giao dich', 400);
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

        success(res, { importedCount: transactionsToCreate.length }, 'Nhap du lieu thanh cong');
    } catch (err) {
        await t.rollback();
        console.error('importTransactions error:', err);
        sendError(res, `Loi khi nhap du lieu: ${err.message}`, 500);
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

        return sendError(res, 'Dinh dang export khong duoc ho tro', 400);
    } catch (err) {
        console.error('exportTransactions error:', err);
        sendError(res, 'Loi export du lieu backend', 500);
    }
};
