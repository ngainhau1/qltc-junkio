'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    // GHI CHÚ HỌC TẬP - Phần quản trị của Thành Đạt:
    // AuditLog lưu lại hành động quan trọng để admin theo dõi ai đã làm gì, tác động vào dữ liệu nào.
    // Model này được auditMiddleware tạo bản ghi sau khi request nhạy cảm thành công.
    class AuditLog extends Model {
        static associate(models) {
            // Nhật ký có thể gắn với user thực hiện và family liên quan nếu có.
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
        // old_value/new_value giúp admin so sánh dữ liệu trước và sau thao tác.
        old_value: DataTypes.JSONB,
        new_value: DataTypes.JSONB,
        ip_address: DataTypes.STRING
    }, {
        sequelize,
        modelName: 'AuditLog',
    });
    return AuditLog;
};
