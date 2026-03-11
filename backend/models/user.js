'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.Wallet, { foreignKey: 'user_id' });
      User.hasMany(models.Transaction, { foreignKey: 'user_id' });
      User.hasOne(models.Family, { as: 'OwnedFamily', foreignKey: 'owner_id' });
      User.belongsToMany(models.Family, { through: models.FamilyMember, foreignKey: 'user_id', as: 'Families' });

      // New associations
      User.hasMany(models.Goal, { foreignKey: 'user_id' });
      User.hasMany(models.Notification, { foreignKey: 'user_id' });
      User.hasMany(models.TransactionShare, { foreignKey: 'user_id' });
    }
  }
  User.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: DataTypes.STRING,
    email: DataTypes.STRING,
    password_hash: DataTypes.STRING,
    role: DataTypes.STRING,
    avatar: DataTypes.STRING,
    is_locked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};