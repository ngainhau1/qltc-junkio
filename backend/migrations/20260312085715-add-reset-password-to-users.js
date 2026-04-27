'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('Users', 'reset_password_token', {
            type: Sequelize.STRING,
            allowNull: true,
        });
        await queryInterface.addColumn('Users', 'reset_password_expires', {
            type: Sequelize.DATE,
            allowNull: true,
        });
    },

    async down(queryInterface, _Sequelize) {
        await queryInterface.removeColumn('Users', 'reset_password_token');
        await queryInterface.removeColumn('Users', 'reset_password_expires');
    }
};
