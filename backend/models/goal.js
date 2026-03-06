'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Goal extends Model {
        static associate(models) {
            // A goal belongs to a user
            Goal.belongsTo(models.User, { foreignKey: 'user_id' });
        }
    }

    Goal.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        targetAmount: {
            type: DataTypes.DECIMAL,
            allowNull: false,
            defaultValue: 0
        },
        currentAmount: {
            type: DataTypes.DECIMAL,
            allowNull: false,
            defaultValue: 0
        },
        deadline: {
            type: DataTypes.DATE,
            allowNull: true
        },
        colorCode: {
            type: DataTypes.STRING,
            defaultValue: '#3b82f6' // Default blue
        },
        imageUrl: {
            type: DataTypes.STRING,
            defaultValue: 'Target' // Default icon name
        },
        status: {
            type: DataTypes.STRING,
            defaultValue: 'IN_PROGRESS' // IN_PROGRESS, ACHIEVED
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false
        }
    }, {
        sequelize,
        modelName: 'Goal',
        tableName: 'goals',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    return Goal;
};
