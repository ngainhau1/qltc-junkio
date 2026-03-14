'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('goals', {
            id: {
                allowNull: false,
                primaryKey: true,
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4
            },
            name: {
                type: Sequelize.STRING,
                allowNull: false
            },
            targetAmount: {
                type: Sequelize.DECIMAL(15, 2),
                allowNull: false,
                defaultValue: 0
            },
            currentAmount: {
                type: Sequelize.DECIMAL(15, 2),
                allowNull: false,
                defaultValue: 0
            },
            deadline: {
                type: Sequelize.DATE,
                allowNull: true
            },
            colorCode: {
                type: Sequelize.STRING,
                defaultValue: '#3b82f6'
            },
            imageUrl: {
                type: Sequelize.STRING,
                defaultValue: 'Target'
            },
            status: {
                type: Sequelize.STRING,
                defaultValue: 'IN_PROGRESS'
            },
            user_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'Users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable('goals');
    }
};
