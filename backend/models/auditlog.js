'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class AuditLog extends Model {
        static associate(models) {
            AuditLog.belongsTo(models.User, { foreignKey: 'user_id' });
            AuditLog.belongsTo(models.Family, { foreignKey: 'family_id' });
        }
    }
    AuditLog.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        user_id: DataTypes.UUID,
        family_id: DataTypes.UUID,
        action: DataTypes.STRING,
        entity_type: DataTypes.STRING,
        entity_id: DataTypes.STRING,
        old_value: DataTypes.JSONB,
        new_value: DataTypes.JSONB,
        ip_address: DataTypes.STRING
    }, {
        sequelize,
        modelName: 'AuditLog',
    });
    return AuditLog;
};
