const { Transaction, Wallet, User, Category, sequelize } = require('../models');
const { Op } = require('sequelize');

// Lấy danh sách giao dịch
exports.getTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.findAll({
            where: { user_id: req.user.id },
            include: [
                { model: Wallet, attributes: ['id', 'name'] },
                { model: Category, attributes: ['id', 'name'] },
                { model: sequelize.models.TransactionShare, as: 'Shares' }
            ],
            order: [['date', 'DESC']]
        });
        res.status(200).json(transactions);
    } catch (error) {
        console.error('Lỗi lấy danh sách giao dịch:', error);
        res.status(500).json({ message: error.message || 'Lỗi lấy danh sách giao dịch' });
    }
};

// Tạo giao dịch thông thường (INCOME / EXPENSE) & Giao dịch Gia Đình (Shared Expenses)
exports.createTransaction = async (req, res) => {
    const { wallet_id, category_id, amount, type, description, date, family_id, shares } = req.body;

    if (!wallet_id || !amount || !type) {
        return res.status(400).json({ message: 'wallet_id, amount and type are required' });
    }

    // Security: Validate amount is a positive number
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({ message: 'Số tiền phải lớn hơn 0' });
    }

    // Security: Validate transaction type
    if (!['INCOME', 'EXPENSE'].includes(type)) {
        return res.status(400).json({ message: 'Loại giao dịch không hợp lệ' });
    }

    const t = await sequelize.transaction();

    try {
        const wallet = await Wallet.findByPk(wallet_id, { transaction: t });
        if (!wallet) {
            throw new Error('Ví không tồn tại');
        }

        // Tạo giao dịch
        const transaction = await Transaction.create({
            user_id: req.user.id,
            wallet_id,
            category_id: (category_id === 'general' || !category_id) ? null : category_id,
            amount,
            type,
            description,
            date: date || new Date(),
            transaction_date: date || new Date(),
            family_id: family_id || null
        }, { transaction: t });

        // Nếu là giao dịch chia tiền gia đình (có shares)
        if (shares && Array.isArray(shares) && shares.length > 0) {
            const sharesToCreate = shares.map(share => ({
                transaction_id: transaction.id,
                user_id: share.user_id,
                amount: share.amount,
                status: share.status || 'UNPAID',
                approval_status: share.approval_status || 'PENDING'
            }));
            await sequelize.models.TransactionShare.bulkCreate(sharesToCreate, { transaction: t });
        }

        // Cập nhật số dư ví
        if (type === 'INCOME') {
            wallet.balance = parseFloat(wallet.balance) + parseFloat(amount);
        } else if (type === 'EXPENSE') {
            wallet.balance = parseFloat(wallet.balance) - parseFloat(amount);
        }
        await wallet.save({ transaction: t });

        await t.commit();
        res.status(201).json(transaction);
    } catch (error) {
        await t.rollback();
        console.error('Lỗi tạo giao dịch:', error);
        res.status(500).json({ message: 'Lỗi tạo giao dịch: ' + error.message });
    }
};

// Xóa giao dịch
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
            return res.status(404).json({ message: 'Giao dịch không tồn tại hoặc bạn không có quyền' });
        }

        const wallet = await Wallet.findByPk(transaction.wallet_id, { transaction: t });

        // Hoàn tiền lại ví
        if (wallet) {
            if (transaction.type === 'INCOME') {
                wallet.balance = parseFloat(wallet.balance) - parseFloat(transaction.amount);
            } else if (transaction.type === 'EXPENSE' || transaction.type === 'TRANSFER_OUT') {
                wallet.balance = parseFloat(wallet.balance) + parseFloat(transaction.amount);
            } else if (transaction.type === 'TRANSFER_IN') {
                wallet.balance = parseFloat(wallet.balance) - parseFloat(transaction.amount);
            }
            await wallet.save({ transaction: t });
        }

        await transaction.destroy({ transaction: t });
        await t.commit();

        res.status(200).json({ message: 'Xóa giao dịch thành công' });
    } catch (error) {
        await t.rollback();
        console.error('Lỗi xóa giao dịch:', error);
        res.status(500).json({ message: 'Lỗi xóa giao dịch: ' + error.message });
    }
};

exports.createTransfer = async (req, res) => {
    const { from_wallet_id, to_wallet_id, amount, description, date } = req.body;

    if (!from_wallet_id || !to_wallet_id || !amount) {
        return res.status(400).json({ message: 'from_wallet_id, to_wallet_id, and amount are required' });
    }

    if (amount <= 0) {
        return res.status(400).json({ message: 'Amount must be greater than zero' });
    }

    // Bắt đầu một Transaction database để đảm bảo tính Acid (Atomicity)
    const t = await sequelize.transaction();

    try {
        // 1. Kiểm tra ví nguồn
        const fromWallet = await Wallet.findByPk(from_wallet_id, { transaction: t });
        if (!fromWallet) {
            throw new Error('Ví nguồn không tồn tại');
        }

        // 2. Kiểm tra ví đích
        const toWallet = await Wallet.findByPk(to_wallet_id, { transaction: t });
        if (!toWallet) {
            throw new Error('Ví đích không tồn tại');
        }

        // 3. Trừ tiền ví nguồn
        fromWallet.balance = parseFloat(fromWallet.balance) - parseFloat(amount);
        await fromWallet.save({ transaction: t });

        // 4. Cộng tiền ví đích
        toWallet.balance = parseFloat(toWallet.balance) + parseFloat(amount);
        await toWallet.save({ transaction: t });

        // 5. Ghi lại lịch sử giao dịch (Transaction Log)

        // Log trừ tiền (EXPENSE từ ví nguồn)
        await Transaction.create({
            amount: amount,
            date: date || new Date(),
            description: description || `Chuyển tiền tới ví ${toWallet.name}`,
            type: 'TRANSFER_OUT',
            wallet_id: from_wallet_id,
        }, { transaction: t });

        // Log cộng tiền (INCOME tới ví đích)
        await Transaction.create({
            amount: amount,
            date: date || new Date(),
            description: description || `Nhận tiền từ ví ${fromWallet.name}`,
            type: 'TRANSFER_IN',
            wallet_id: to_wallet_id,
        }, { transaction: t });

        // NẾU TẤT CẢ THÀNH CÔNG, CHẤP NHẬN TOÀN BỘ (COMMIT)
        await t.commit();

        res.status(200).json({
            message: 'Chuyển tiền thành công',
            from_wallet_balance: fromWallet.balance,
            to_wallet_balance: toWallet.balance
        });

    } catch (error) {
        await t.rollback();
        console.error('Lỗi giao dịch chuyển tiền, đã Rollback:', error);
        res.status(500).json({ message: 'Lỗi giao dịch chuyển tiền: ' + error.message });
    }
};

exports.importTransactions = async (req, res) => {
    const { transactions } = req.body;

    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
        return res.status(400).json({ message: 'Danh sách giao dịch không hợp lệ' });
    }

    const t = await sequelize.transaction();

    try {
        // Collect unique wallet IDs to fetch them at once
        const walletIds = [...new Set(transactions.map(tx => tx.wallet_id))];
        const wallets = await Wallet.findAll({
            where: { id: { [Op.in]: walletIds } },
            transaction: t
        });

        const walletMap = {};
        wallets.forEach(w => { walletMap[w.id] = w; });

        const transactionsToCreate = [];

        for (const tx of transactions) {
            const wallet = walletMap[tx.wallet_id];
            if (!wallet) {
                // Ignore transactions pointing to non-existent wallets
                continue;
            }

            const amount = parseFloat(tx.amount);
            if (isNaN(amount) || amount <= 0) continue;

            // 1. Prepare transaction for creation
            transactionsToCreate.push({
                user_id: req.user.id, // Authenticated user
                wallet_id: tx.wallet_id,
                category_id: tx.category_id || 'general',
                amount: amount,
                type: tx.type === 'INCOME' ? 'INCOME' : 'EXPENSE',
                description: tx.description || 'Imported Transaction',
                date: tx.date ? new Date(tx.date) : new Date(),
                transaction_date: tx.date ? new Date(tx.date) : new Date()
            });

            // 2. Adjust wallet balance locally
            if (tx.type === 'INCOME') {
                wallet.balance = parseFloat(wallet.balance) + amount;
            } else {
                wallet.balance = parseFloat(wallet.balance) - amount;
            }
        }

        // Save all updated wallet balances
        for (const wallet of Object.values(walletMap)) {
            await wallet.save({ transaction: t });
        }

        // Bulk insert all valid transactions
        await Transaction.bulkCreate(transactionsToCreate, { transaction: t });

        await t.commit();

        res.status(200).json({
            message: 'Nhập dữ liệu thành công',
            importedCount: transactionsToCreate.length
        });

    } catch (error) {
        await t.rollback();
        console.error('Lỗi import dữ liệu, đã Rollback:', error);
        res.status(500).json({ message: 'Lỗi khi nhập dữ liệu: ' + error.message });
    }
};
