const { Goal, Wallet, Transaction, sequelize } = require('../models');
const { success, error: sendError, notFound, serverError, created } = require('../utils/responseHelper');

exports.getGoals = async (req, res) => {
    try {
        const userId = req.user.id;
        const goals = await Goal.findAll({
            where: { user_id: userId },
            order: [['created_at', 'DESC']]
        });
        success(res, goals, 'Lay danh sach muc tieu thanh cong');
    } catch (err) {
        console.error('Error fetching goals:', err);
        serverError(res, err.message || 'Khong the tai muc tieu');
    }
};

exports.createGoal = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, targetAmount, deadline, colorCode, imageUrl } = req.body;

        const newGoal = await Goal.create({
            name,
            targetAmount: targetAmount || 0,
            currentAmount: 0,
            deadline: deadline || null,
            colorCode: colorCode || '#emerald-500',
            imageUrl: imageUrl || 'Target',
            status: 'IN_PROGRESS',
            user_id: userId
        });

        created(res, newGoal, 'Tao muc tieu thanh cong');
    } catch (err) {
        console.error('Error creating goal:', err);
        serverError(res, 'Khong the tao muc tieu');
    }
};

exports.updateGoal = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { name, targetAmount, deadline, colorCode, imageUrl, status } = req.body;

        const goal = await Goal.findOne({ where: { id, user_id: userId } });

        if (!goal) return notFound(res, 'Muc tieu khong ton tai');

        await goal.update({
            name: name !== undefined ? name : goal.name,
            targetAmount: targetAmount !== undefined ? targetAmount : goal.targetAmount,
            deadline: deadline !== undefined ? deadline : goal.deadline,
            colorCode: colorCode !== undefined ? colorCode : goal.colorCode,
            imageUrl: imageUrl !== undefined ? imageUrl : goal.imageUrl,
            status: status !== undefined ? status : goal.status
        });

        success(res, goal, 'Cap nhat muc tieu thanh cong');
    } catch (err) {
        console.error('Error updating goal:', err);
        serverError(res, 'Khong the cap nhat muc tieu');
    }
};

exports.deposit = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { amount, wallet_id } = req.body;

        if (!amount || amount <= 0) return sendError(res, 'So tien khong hop le', 400);
        if (!wallet_id) return sendError(res, 'Vui long cung cap ID vi', 400);

        const goal = await Goal.findOne({ where: { id, user_id: userId } });
        if (!goal) return notFound(res, 'Muc tieu khong ton tai');

        const wallet = await Wallet.findByPk(wallet_id);
        if (!wallet) return notFound(res, 'Vi khong ton tai');

        if (wallet.user_id !== userId || wallet.family_id) {
            return sendError(res, 'Chi duoc nap muc tieu tu vi ca nhan cua chinh ban', 403);
        }

        if (parseFloat(wallet.balance) < parseFloat(amount)) {
            return sendError(res, 'So du vi khong du', 400);
        }

        const result = await sequelize.transaction(async (transaction) => {
            const nextWalletBalance = parseFloat(wallet.balance) - parseFloat(amount);
            await wallet.update({ balance: nextWalletBalance }, { transaction });

            const nextGoalAmount = parseFloat(goal.currentAmount) + parseFloat(amount);
            const nextStatus = nextGoalAmount >= parseFloat(goal.targetAmount) ? 'ACHIEVED' : 'IN_PROGRESS';
            await goal.update({ currentAmount: nextGoalAmount, status: nextStatus }, { transaction });

            await Transaction.create({
                user_id: userId,
                wallet_id: wallet.id,
                family_id: null,
                amount,
                type: 'EXPENSE',
                description: `Goal deposit: ${goal.name}`,
                date: new Date()
            }, { transaction });

            return {
                ...goal.toJSON(),
                sourceWallet: {
                    id: wallet.id,
                    balance: nextWalletBalance
                }
            };
        });

        success(res, result, 'Nap tien vao muc tieu thanh cong');
    } catch (err) {
        console.error('Error depositing to goal:', err);
        serverError(res, 'Khong the nap tien vao muc tieu');
    }
};

exports.deleteGoal = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const goal = await Goal.findOne({ where: { id, user_id: userId } });
        if (!goal) return notFound(res, 'Muc tieu khong ton tai');

        await goal.destroy();
        success(res, null, 'Da xoa muc tieu thanh cong');
    } catch (err) {
        console.error('Error deleting goal:', err);
        serverError(res, 'Khong the xoa muc tieu');
    }
};
