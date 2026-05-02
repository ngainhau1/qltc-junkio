'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('FamilyInvitations', {
            id: {
                allowNull: false,
                primaryKey: true,
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4
            },
            family_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'Families',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            code: {
                type: Sequelize.STRING(16),
                allowNull: false,
                unique: true
            },
            role: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: 'MEMBER'
            },
            created_by: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'Users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            expires_at: {
                type: Sequelize.DATE,
                allowNull: false
            },
            used_at: {
                type: Sequelize.DATE,
                allowNull: true
            },
            used_by: {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: 'Users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
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

    async down(queryInterface) {
        await queryInterface.dropTable('FamilyInvitations');
    }
};
