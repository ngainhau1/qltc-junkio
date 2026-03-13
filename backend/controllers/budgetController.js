const { Budget, Category } = require('../models');

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

        res.json(budgets);
    } catch (error) {
        console.error('Error fetching budgets:', error);
        res.status(500).json({ message: 'Server error' });
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

        res.status(201).json(newBudget);
    } catch (error) {
        console.error('Error creating budget:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// PUT /api/budgets/:id
exports.updateBudget = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount_limit, start_date, end_date } = req.body;

        const budget = await Budget.findByPk(id);
        if (!budget) return res.status(404).json({ message: 'Budget not found' });

        await budget.update({
            amount_limit: amount_limit !== undefined ? amount_limit : budget.amount_limit,
            start_date: start_date !== undefined ? start_date : budget.start_date,
            end_date: end_date !== undefined ? end_date : budget.end_date
        });

        res.json(budget);
    } catch (error) {
        console.error('Error updating budget:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// DELETE /api/budgets/:id
exports.deleteBudget = async (req, res) => {
    try {
        const { id } = req.params;
        const budget = await Budget.findByPk(id);
        if (!budget) return res.status(404).json({ message: 'Budget not found' });

        await budget.destroy();
        res.json({ message: 'Budget deleted successfully' });
    } catch (error) {
        console.error('Error deleting budget:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
