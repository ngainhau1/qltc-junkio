'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Transaction extends Model {
    static associate(models) {
      Transaction.belongsTo(models.Wallet, { foreignKey: 'wallet_id' });
      Transaction.belongsTo(models.Category, { foreignKey: 'category_id' });
      Transaction.belongsTo(models.User, { foreignKey: 'user_id' });
      Transaction.belongsTo(models.Family, { foreignKey: 'family_id' }); // Optional direct link if needed
    }
  }
  Transaction.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    amount: DataTypes.DECIMAL,
    date: DataTypes.DATE,
    description: DataTypes.STRING,
    type: DataTypes.STRING,
    wallet_id: DataTypes.UUID,
    category_id: DataTypes.UUID,
    user_id: DataTypes.UUID
  }, {
    sequelize,
    modelName: 'Transaction',
  });
  return Transaction;
};