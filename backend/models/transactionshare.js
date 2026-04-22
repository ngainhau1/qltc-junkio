'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class TransactionShare extends Model {
        static associate(models) {
            // A share belongs to a specific transaction
            TransactionShare.belongsTo(models.Transaction, { foreignKey: 'transaction_id', as: 'Transaction' });
            // A share is assigned to a specific user (the one who owes or is owed)
            TransactionShare.belongsTo(models.User, { foreignKey: 'user_id', as: 'User' });
        }
    }

    TransactionShare.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        transaction_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        amount: {
            type: DataTypes.DECIMAL,
            allowNull: false
        },
        status: {
            type: DataTypes.STRING,
            defaultValue: 'UNPAID' // UNPAID, PAID
        },
        approval_status: {
            type: DataTypes.STRING,
            defaultValue: 'APPROVED' // APPROVED, REJECTED
        }
    }, {
        sequelize,
        modelName: 'TransactionShare',
        tableName: 'transaction_shares',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    return TransactionShare;
};
