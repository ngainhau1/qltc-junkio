'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('Budgets', 'user_id', {
            type: Sequelize.UUID,
            allowNull: true,
            references: {
                model: 'Users',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
        });

        await queryInterface.addIndex('Budgets', ['user_id']);
        await queryInterface.addIndex('Budgets', ['family_id']);
    },

    async down(queryInterface) {
        await queryInterface.removeIndex('Budgets', ['user_id']);
        await queryInterface.removeIndex('Budgets', ['family_id']);
        await queryInterface.removeColumn('Budgets', 'user_id');
    }
};
