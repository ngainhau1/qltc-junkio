'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Category extends Model {
    static associate(models) {
      Category.hasMany(models.Transaction, { foreignKey: 'category_id' });
      Category.hasMany(models.Budget, { foreignKey: 'category_id' });
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