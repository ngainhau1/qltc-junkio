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

            // A transaction can have multiple shares (for splitting debts)
            Transaction.hasMany(models.TransactionShare, { foreignKey: 'transaction_id', as: 'Shares' });
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
        user_id: DataTypes.UUID,
        family_id: DataTypes.UUID
    }, {
        sequelize,
        modelName: 'Transaction',
    });
    return Transaction;
};