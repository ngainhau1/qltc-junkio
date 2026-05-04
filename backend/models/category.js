'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Category extends Model {
        static associate(models) {
            Category.hasMany(models.Transaction, { foreignKey: 'category_id' });
            Category.hasMany(models.Budget, { foreignKey: 'category_id' });
            // Cho phép tạo danh mục cha-con: Nếu parent_id bằng null, đây là danh mục gốc (Root Category).
            // Nếu parent_id trỏ đến UUID của một Category khác, nó sẽ trở thành danh mục con (ví dụ: Parent="Ăn uống", Child="Cà phê").
            Category.belongsTo(models.Category, { as: 'Parent', foreignKey: 'parent_id' });
            Category.hasMany(models.Category, { as: 'Children', foreignKey: 'parent_id' });
        }
    }
    Category.init({
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