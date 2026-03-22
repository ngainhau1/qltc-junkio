const { Category } = require('../models');
const { success, error, notFound, serverError, created } = require('../utils/responseHelper');

// GET /api/categories
exports.getCategories = async (req, res) => {
    try {
        const categories = await Category.findAll({
            // could include parent/child relation if needed
        });
        success(res, categories, 'Lấy danh sách danh mục thành công');
    } catch (err) {
        console.error('Error fetching categories:', err);
        serverError(res, 'Lỗi Server: Không thể tải danh mục');
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

        created(res, newCategory, 'Tạo danh mục mới thành công');
    } catch (err) {
        console.error('Error creating category:', err);
        serverError(res, 'Lỗi Server: Không thể tạo danh mục');
    }
};

// PUT /api/categories/:id
exports.updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, type, icon } = req.body;

        const category = await Category.findByPk(id);
        if (!category) return notFound(res, 'Danh mục không tồn tại');

        await category.update({
            name: name !== undefined ? name : category.name,
            type: type !== undefined ? type : category.type,
            icon: icon !== undefined ? icon : category.icon
        });

        success(res, category, 'Cập nhật danh mục thành công');
    } catch (err) {
        console.error('Error updating category:', err);
        serverError(res, 'Lỗi Server: Không thể cập nhật danh mục');
    }
};

// DELETE /api/categories/:id
exports.deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await Category.findByPk(id);
        if (!category) return notFound(res, 'Danh mục không tồn tại');

        await category.destroy();
        success(res, null, 'Đã xóa danh mục thành công');
    } catch (err) {
        console.error('Error deleting category:', err);
        serverError(res, 'Lỗi Server: Không thể xóa danh mục');
    }
};
