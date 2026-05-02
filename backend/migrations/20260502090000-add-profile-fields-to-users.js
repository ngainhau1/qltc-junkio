'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('Users', 'phone', {
            type: Sequelize.STRING(32),
            allowNull: true,
        });

        await queryInterface.addColumn('Users', 'date_of_birth', {
            type: Sequelize.DATEONLY,
            allowNull: true,
        });
    },

    async down(queryInterface, _Sequelize) {
        await queryInterface.removeColumn('Users', 'date_of_birth');
        await queryInterface.removeColumn('Users', 'phone');
    },
};
