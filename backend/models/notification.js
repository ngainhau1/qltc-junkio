'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Notification extends Model {
        static associate(models) {
            Notification.belongsTo(models.User, { foreignKey: 'user_id' });
        }
    }

    Notification.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        type: {
            type: DataTypes.STRING,
            allowNull: false
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'Notification'
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        isRead: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        reference_id: {
            type: DataTypes.UUID,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'Notification',
        tableName: 'notifications',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    return Notification;
};
