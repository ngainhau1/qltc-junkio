'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Budget extends Model {
    static associate(models) {
      Budget.belongsTo(models.Category, { foreignKey: 'category_id' });
      Budget.belongsTo(models.Family, { foreignKey: 'family_id' }); // Optional: if budgets are per family
    }
  }
  Budget.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    amount_limit: DataTypes.DECIMAL,
    start_date: DataTypes.DATEONLY,
    end_date: DataTypes.DATEONLY,
    category_id: DataTypes.UUID,
    family_id: DataTypes.UUID
  }, {
    sequelize,
    modelName: 'Budget',
  });
  return Budget;
};