'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('AuditLogs', {
            id: {
                allowNull: false,
                primaryKey: true,
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4
            },
            user_id: {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: 'Users',
                    key: 'id'
                },
                onDelete: 'SET NULL',
                onUpdate: 'CASCADE'
            },
            family_id: {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: 'Families',
                    key: 'id'
                },
                onDelete: 'SET NULL',
                onUpdate: 'CASCADE'
            },
            action: {
                type: Sequelize.STRING,
                allowNull: false
            },
            entity_type: {
                type: Sequelize.STRING,
                allowNull: true
            },
            entity_id: {
                type: Sequelize.STRING,
                allowNull: true
            },
            old_value: {
                type: Sequelize.JSONB,
                allowNull: true
            },
            new_value: {
                type: Sequelize.JSONB,
                allowNull: true
            },
            ip_address: {
                type: Sequelize.STRING,
                allowNull: true
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('AuditLogs');
    }
};
