'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class FamilyMember extends Model {
    static associate(models) {
      FamilyMember.belongsTo(models.User, { foreignKey: 'user_id' });
      FamilyMember.belongsTo(models.Family, { foreignKey: 'family_id' });
    }
  }
  FamilyMember.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    family_id: DataTypes.UUID,
    user_id: DataTypes.UUID,
    role: DataTypes.STRING,
    joined_at: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'FamilyMember',
  });
  return FamilyMember;
};