'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('transaction_shares', {
            id: {
                allowNull: false,
                primaryKey: true,
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4
            },
            transaction_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'Transactions',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
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
            amount: {
                type: Sequelize.DECIMAL(15, 2),
                allowNull: false
            },
            status: {
                type: Sequelize.STRING,
                defaultValue: 'UNPAID'
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
        await queryInterface.dropTable('transaction_shares');
    }
};
