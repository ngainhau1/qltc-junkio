'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Wallet extends Model {
    static associate(models) {
      Wallet.belongsTo(models.User, { foreignKey: 'user_id' });
      Wallet.belongsTo(models.Family, { foreignKey: 'family_id' });
      Wallet.hasMany(models.Transaction, { foreignKey: 'wallet_id' });
    }
  }
  Wallet.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: DataTypes.STRING,
    balance: DataTypes.DECIMAL,
    currency: DataTypes.STRING,
    user_id: DataTypes.UUID,
    family_id: DataTypes.UUID
  }, {
    sequelize,
    modelName: 'Wallet',
  });
  return Wallet;
};