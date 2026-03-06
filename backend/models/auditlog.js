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
        family_id: DataTypes.UUID, // Ràng buộc log với gia đình cụ thể
        action: DataTypes.STRING, // CREATE, UPDATE, DELETE
        entity_type: DataTypes.STRING, // TRANSACTION, WALLET, BUDGET
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
