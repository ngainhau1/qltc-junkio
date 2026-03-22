const { Goal, Wallet, Transaction } = require('../models');
const { success, error: sendError, notFound, serverError, created } = require('../utils/responseHelper');

// GET /api/goals
// Lấy danh sách mục tiêu của user
exports.getGoals = async (req, res) => {
    try {
        const userId = req.user.id;
        const goals = await Goal.findAll({
            where: { user_id: userId },
            order: [['created_at', 'DESC']]
        });
        success(res, goals, 'Lấy danh sách mục tiêu thành công');
    } catch (err) {
        console.error('Error fetching goals:', err);
        serverError(res, err.message || 'Lỗi Server: Không thể tải mục tiêu');
    }
};

// POST /api/goals
// Tạo mục tiêu mới
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

        created(res, newGoal, 'Tạo mục tiêu thành công');
    } catch (err) {
        console.error('Error creating goal:', err);
        serverError(res, 'Lỗi Server: Không thể tạo mục tiêu');
    }
};

// PUT /api/goals/:id
// Cập nhật thông tin cơ bản mục tiêu
exports.updateGoal = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { name, targetAmount, deadline, colorCode, imageUrl, status } = req.body;

        const goal = await Goal.findOne({ where: { id, user_id: userId } });

        if (!goal) return notFound(res, 'Mục tiêu không tồn tại');

        await goal.update({
            name: name !== undefined ? name : goal.name,
            targetAmount: targetAmount !== undefined ? targetAmount : goal.targetAmount,
            deadline: deadline !== undefined ? deadline : goal.deadline,
            colorCode: colorCode !== undefined ? colorCode : goal.colorCode,
            imageUrl: imageUrl !== undefined ? imageUrl : goal.imageUrl,
            status: status !== undefined ? status : goal.status
        });

        success(res, goal, 'Cập nhật mục tiêu thành công');
    } catch (err) {
        console.error('Error updating goal:', err);
        serverError(res, 'Lỗi Server: Không thể cập nhật mục tiêu');
    }
};

// POST /api/goals/:id/deposit
// Nạp tiền vào mục tiêu
exports.deposit = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { amount, wallet_id } = req.body;

        if (!amount || amount <= 0) return sendError(res, 'Số tiền không hợp lệ', 400);
        if (!wallet_id) return sendError(res, 'Vui lòng cung cấp ID ví', 400);

        const goal = await Goal.findOne({ where: { id, user_id: userId } });
        if (!goal) return notFound(res, 'Mục tiêu không tồn tại');

        const wallet = await Wallet.findByPk(wallet_id);
        if (!wallet) return notFound(res, 'Ví không tồn tại');

        // Authorization cho wallet nên có, nhưng tạm bỏ qua kiểm tra sâu ở đây
        if (parseFloat(wallet.balance) < parseFloat(amount)) {
            return sendError(res, 'Số dư ví không đủ', 400);
        }

        const sequelize = require('../models/index').sequelize;

        const result = await sequelize.transaction(async (t) => {
            // 1. Trừ tiền ví
            await wallet.update({ balance: parseFloat(wallet.balance) - parseFloat(amount) }, { transaction: t });

            // 2. Cộng tiền mục tiêu
            const newAmount = parseFloat(goal.currentAmount) + parseFloat(amount);
            const status = newAmount >= goal.targetAmount ? 'ACHIEVED' : 'IN_PROGRESS';
            await goal.update({ currentAmount: newAmount, status }, { transaction: t });

            // 3. (Optional) Tạo Transaction Report lưu lịch sử xuất tiền khỏi ví
            await Transaction.create({
                user_id: userId,
                wallet_id: wallet.id,
                family_id: wallet.family_id,
                amount: amount,
                type: 'EXPENSE',
                description: `Deposit to limit goal: ${goal.name}`,
                date: new Date()
            }, { transaction: t });

            return goal;
        });

        success(res, result, 'Nạp tiền vào mục tiêu thành công');
    } catch (err) {
        console.error('Error depositing to goal:', err);
        serverError(res, 'Lỗi Server: Không thể nạp tiền');
    }
};

// DELETE /api/goals/:id
// Xóa mục tiêu
exports.deleteGoal = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const goal = await Goal.findOne({ where: { id, user_id: userId } });
        if (!goal) return notFound(res, 'Mục tiêu không tồn tại');

        await goal.destroy();
        success(res, null, 'Đã xóa mục tiêu thành công');
    } catch (err) {
        console.error('Error deleting goal:', err);
        serverError(res, 'Lỗi Server: Không thể xóa mục tiêu');
    }
};
