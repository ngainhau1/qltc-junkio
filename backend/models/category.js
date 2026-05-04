'use strict';

const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    /**
     * Category la danh muc thu/chi dung chung cho transaction, budget va bao cao.
     *
     * `type` phan biet nhom nghiep vu thu nhap/chi tieu.
     * `parent_id` cho phep tao cay danh muc 2 cap hoac nhieu cap neu UI can mo rong.
     * Cac label tieng Viet hien thi tren UI thuong duoc lay tu seed/i18n, con model
     * chi luu du lieu nghiep vu can truy van va lien ket.
     */
    class Category extends Model {
        static associate(models) {
            Category.hasMany(models.Transaction, { foreignKey: 'category_id' });
            Category.hasMany(models.Budget, { foreignKey: 'category_id' });
            Category.belongsTo(models.Category, { as: 'Parent', foreignKey: 'parent_id' });
            Category.hasMany(models.Category, { as: 'Children', foreignKey: 'parent_id' });
        }
    }
    Category.init({
        // UUID giup category on dinh khi seed/demo va tranh collision giua moi truong.
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        name: DataTypes.STRING,
        type: DataTypes.STRING,
        parent_id: DataTypes.UUID,
        icon: DataTypes.STRING
    }, {
        sequelize,
        modelName: 'Category',
    });
    return Category;
};