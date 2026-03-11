'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class RecurringPattern extends Model {
        static associate(models) {
            RecurringPattern.belongsTo(models.User, { foreignKey: 'user_id' });
            RecurringPattern.belongsTo(models.Wallet, { foreignKey: 'wallet_id' });
            RecurringPattern.belongsTo(models.Category, { foreignKey: 'category_id' });
        }
    }
    RecurringPattern.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        user_id: DataTypes.UUID,
        wallet_id: DataTypes.UUID,
        category_id: DataTypes.UUID,
        amount: DataTypes.DECIMAL,
        type: DataTypes.STRING, // 'INCOME' or 'EXPENSE'
        description: DataTypes.STRING,
        frequency: DataTypes.STRING, // 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'
        next_run_date: DataTypes.DATEONLY, // Chỉ cần lưu ngày chạy tiếp theo
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        }
    }, {
        sequelize,
        modelName: 'RecurringPattern',
        tableName: 'RecurringPatterns',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });
    return RecurringPattern;
};
