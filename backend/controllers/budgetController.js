const { Budget, Category } = require('../models');
const { success, error, notFound, serverError, created } = require('../utils/responseHelper');

// GET /api/budgets
exports.getBudgets = async (req, res) => {
    try {
        const userId = req.user.id;
        // In this schema, budget has family_id. If personal, maybe family_id is null? Or we need user_id in Budget model.
        // Assuming we query budgets based on family_id that user belongs to, similar to wallets.
        const { FamilyMember } = require('../models');
        const userFamilies = await FamilyMember.findAll({
            where: { user_id: userId },
            attributes: ['family_id']
        });
        const familyIds = userFamilies.map(f => f.family_id);

        const budgets = await Budget.findAll({
            where: { family_id: familyIds },
            include: [{ model: Category, attributes: ['id', 'name', 'icon'] }]
        });

        success(res, budgets, 'Lấy danh sách ngân sách thành công');
    } catch (err) {
        console.error('Error fetching budgets:', err);
        serverError(res, 'Lỗi Server: Không thể tải ngân sách');
    }
};

// POST /api/budgets
exports.createBudget = async (req, res) => {
    try {
        const { amount_limit, start_date, end_date, category_id, family_id } = req.body;

        const newBudget = await Budget.create({
            amount_limit,
            start_date,
            end_date,
            category_id,
            family_id
        });

        created(res, newBudget, 'Tạo ngân sách mới thành công');
    } catch (err) {
        console.error('Error creating budget:', err);
        serverError(res, 'Lỗi Server: Không thể tạo ngân sách');
    }
};

// PUT /api/budgets/:id
exports.updateBudget = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount_limit, start_date, end_date } = req.body;

        const budget = await Budget.findByPk(id);
        if (!budget) return notFound(res, 'Ngân sách không tồn tại');

        await budget.update({
            amount_limit: amount_limit !== undefined ? amount_limit : budget.amount_limit,
            start_date: start_date !== undefined ? start_date : budget.start_date,
            end_date: end_date !== undefined ? end_date : budget.end_date
        });

        success(res, budget, 'Cập nhật ngân sách thành công');
    } catch (err) {
        console.error('Error updating budget:', err);
        serverError(res, 'Lỗi Server: Không thể cập nhật ngân sách');
    }
};

// DELETE /api/budgets/:id
exports.deleteBudget = async (req, res) => {
    try {
        const { id } = req.params;
        const budget = await Budget.findByPk(id);
        if (!budget) return notFound(res, 'Ngân sách không tồn tại');

        await budget.destroy();
        success(res, null, 'Đã xóa ngân sách thành công');
    } catch (err) {
        console.error('Error deleting budget:', err);
        serverError(res, 'Lỗi Server: Không thể xóa ngân sách');
    }
};
