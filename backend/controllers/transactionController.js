const { Transaction, Wallet, User, sequelize } = require('../models');

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
        // NẾU CÓ BẤT KỲ LỖI NÀO (Ví không đủ tiền, lỗi mạng, mất điện server), HỦY TOÀN BỘ (ROLLBACK)
        await t.rollback();
        console.error('Lỗi giao dịch chuyển tiền, đã Rollback:', error);
        res.status(500).json({ message: 'Lỗi giao dịch chuyển tiền: ' + error.message });
    }
};
