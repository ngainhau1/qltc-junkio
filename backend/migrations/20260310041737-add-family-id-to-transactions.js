'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('Transactions', 'family_id', {
            type: Sequelize.UUID,
            allowNull: true,
            references: {
                model: 'Families',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('Transactions', 'family_id');
    }
};
