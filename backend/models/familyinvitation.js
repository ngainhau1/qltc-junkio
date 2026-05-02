'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class FamilyInvitation extends Model {
        static associate(models) {
            FamilyInvitation.belongsTo(models.Family, { foreignKey: 'family_id' });
            FamilyInvitation.belongsTo(models.User, { as: 'Creator', foreignKey: 'created_by' });
            FamilyInvitation.belongsTo(models.User, { as: 'UsedBy', foreignKey: 'used_by' });
        }
    }

    FamilyInvitation.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        family_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        code: {
            type: DataTypes.STRING(16),
            allowNull: false,
            unique: true
        },
        role: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'MEMBER'
        },
        created_by: {
            type: DataTypes.UUID,
            allowNull: false
        },
        expires_at: {
            type: DataTypes.DATE,
            allowNull: false
        },
        used_at: DataTypes.DATE,
        used_by: DataTypes.UUID
    }, {
        sequelize,
        modelName: 'FamilyInvitation',
    });

    return FamilyInvitation;
};
