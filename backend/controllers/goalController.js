const { Goal, Wallet, Transaction, sequelize } = require('../models');
const { success, error: sendError, notFound, serverError, created } = require('../utils/responseHelper');

exports.getGoals = async (req, res) => {
    try {
        const userId = req.user.id;
        const goals = await Goal.findAll({
            where: { user_id: userId },
            order: [['created_at', 'DESC']]
        });
        success(res, goals, 'GOALS_LOADED');
    } catch (err) {
        console.error('Error fetching goals:', err);
        serverError(res, err.message || 'GOAL_LOAD_FAILED');
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

        created(res, newGoal, 'GOAL_CREATED');
    } catch (err) {
        console.error('Error creating goal:', err);
        serverError(res, 'GOAL_CREATE_FAILED');
    }
};

exports.updateGoal = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { name, targetAmount, deadline, colorCode, imageUrl, status } = req.body;

        const goal = await Goal.findOne({ where: { id, user_id: userId } });

        if (!goal) return notFound(res, 'GOAL_NOT_FOUND');

        await goal.update({
            name: name !== undefined ? name : goal.name,
            targetAmount: targetAmount !== undefined ? targetAmount : goal.targetAmount,
            deadline: deadline !== undefined ? deadline : goal.deadline,
            colorCode: colorCode !== undefined ? colorCode : goal.colorCode,
            imageUrl: imageUrl !== undefined ? imageUrl : goal.imageUrl,
            status: status !== undefined ? status : goal.status
        });

        success(res, goal, 'GOAL_UPDATED');
    } catch (err) {
        console.error('Error updating goal:', err);
        serverError(res, 'GOAL_UPDATE_FAILED');
    }
};

exports.deposit = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { amount, wallet_id } = req.body;

        if (!amount || amount <= 0) return sendError(res, 'INVALID_AMOUNT', 400);
        if (!wallet_id) return sendError(res, 'WALLET_ID_REQUIRED', 400);

        const goal = await Goal.findOne({ where: { id, user_id: userId } });
        if (!goal) return notFound(res, 'GOAL_NOT_FOUND');

        const wallet = await Wallet.findByPk(wallet_id);
        if (!wallet) return notFound(res, 'WALLET_NOT_FOUND');

        if (wallet.user_id !== userId || wallet.family_id) {
            return sendError(res, 'WALLET_PERSONAL_ONLY', 403);
        }

        if (parseFloat(wallet.balance) < parseFloat(amount)) {
            return sendError(res, 'INSUFFICIENT_BALANCE', 400);
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

        success(res, result, 'GOAL_DEPOSIT_SUCCESS');
    } catch (err) {
        console.error('Error depositing to goal:', err);
        serverError(res, 'GOAL_DEPOSIT_FAILED');
    }
};

exports.deleteGoal = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const goal = await Goal.findOne({ where: { id, user_id: userId } });
        if (!goal) return notFound(res, 'GOAL_NOT_FOUND');

        await goal.destroy();
        success(res, null, 'GOAL_DELETED');
    } catch (err) {
        console.error('Error deleting goal:', err);
        serverError(res, 'GOAL_DELETE_FAILED');
    }
};
