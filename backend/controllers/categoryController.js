const { Category } = require('../models');

// GET /api/categories
exports.getCategories = async (req, res) => {
    try {
        const categories = await Category.findAll({
            // could include parent/child relation if needed
        });
        res.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// POST /api/categories
exports.createCategory = async (req, res) => {
    try {
        const { name, type, parent_id, icon } = req.body;

        const newCategory = await Category.create({
            name,
            type, // 'INCOME', 'EXPENSE'
            parent_id: parent_id || null,
            icon: icon || 'Circle'
        });

        res.status(201).json(newCategory);
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// PUT /api/categories/:id
exports.updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, type, icon } = req.body;

        const category = await Category.findByPk(id);
        if (!category) return res.status(404).json({ message: 'Category not found' });

        await category.update({
            name: name !== undefined ? name : category.name,
            type: type !== undefined ? type : category.type,
            icon: icon !== undefined ? icon : category.icon
        });

        res.json(category);
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// DELETE /api/categories/:id
exports.deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await Category.findByPk(id);
        if (!category) return res.status(404).json({ message: 'Category not found' });

        await category.destroy();
        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
