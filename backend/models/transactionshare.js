'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class TransactionShare extends Model {
        static associate(models) {
            TransactionShare.belongsTo(models.Transaction, { foreignKey: 'transaction_id', as: 'Transaction' });
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
            defaultValue: 'UNPAID'
        },
        approval_status: {
            type: DataTypes.STRING,
            defaultValue: 'APPROVED'
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
