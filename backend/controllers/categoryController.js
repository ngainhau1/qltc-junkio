const { Category } = require('../models');
const { success, notFound, serverError, created } = require('../utils/responseHelper');

// GHI CHÚ HỌC TẬP - Phần danh mục của Thành Đạt:
// Danh mục dùng để phân loại giao dịch thu/chi. parent_id cho phép tạo danh mục cha-con,
// ví dụ "Ăn uống" là cha và "Cà phê" là con.

exports.getCategories = async (req, res) => {
    try {
        const categories = await Category.findAll();
        return success(res, categories, 'CATEGORY_LIST_FETCH_SUCCESS');
    } catch (error) {
        console.error('Error fetching categories:', error);
        return serverError(res, 'CATEGORY_LOAD_FAILED');
    }
};

exports.createCategory = async (req, res) => {
    try {
        const { name, type, parent_id, icon } = req.body;

        const newCategory = await Category.create({
            name,
            type,
            // parent_id null nghĩa là danh mục gốc, không nằm dưới danh mục khác.
            parent_id: parent_id || null,
            // Nếu frontend không gửi icon, dùng Circle để giao diện vẫn có biểu tượng mặc định.
            icon: icon || 'Circle',
        });

        return created(res, newCategory, 'CATEGORY_CREATE_SUCCESS');
    } catch (error) {
        console.error('Error creating category:', error);
        return serverError(res, 'CATEGORY_CREATE_FAILED');
    }
};

exports.updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, type, icon } = req.body;

        const category = await Category.findByPk(id);
        if (!category) {
            // Không tìm thấy danh mục thì dừng sớm, tránh update nhầm dữ liệu.
            return notFound(res, 'CATEGORY_NOT_FOUND');
        }

        await category.update({
            name: name !== undefined ? name : category.name,
            type: type !== undefined ? type : category.type,
            icon: icon !== undefined ? icon : category.icon,
        });

        return success(res, category, 'CATEGORY_UPDATE_SUCCESS');
    } catch (error) {
        console.error('Error updating category:', error);
        return serverError(res, 'CATEGORY_UPDATE_FAILED');
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await Category.findByPk(id);

        if (!category) {
            // Xóa danh mục chỉ được thực hiện khi id tồn tại.
            return notFound(res, 'CATEGORY_NOT_FOUND');
        }

        await category.destroy();
        return success(res, null, 'CATEGORY_DELETE_SUCCESS');
    } catch (error) {
        console.error('Error deleting category:', error);
        return serverError(res, 'CATEGORY_DELETE_FAILED');
    }
};
