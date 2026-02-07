'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Family extends Model {
    static associate(models) {
      Family.belongsTo(models.User, { as: 'Owner', foreignKey: 'owner_id' });
      Family.belongsToMany(models.User, { through: models.FamilyMember, foreignKey: 'family_id', as: 'Members' });
      Family.hasMany(models.Wallet, { foreignKey: 'family_id' });
      Family.hasMany(models.Budget, { foreignKey: 'family_id' });
      Family.hasMany(models.Transaction, { foreignKey: 'family_id' }); // If keeping track of family transactions directly or derived
    }
  }
  Family.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: DataTypes.STRING,
    owner_id: DataTypes.UUID
  }, {
    sequelize,
    modelName: 'Family',
  });
  return Family;
};