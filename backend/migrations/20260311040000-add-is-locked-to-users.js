'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('Users', 'is_locked', {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
            allowNull: false
        });
    },
    down: async (queryInterface) => {
        await queryInterface.removeColumn('Users', 'is_locked');
    }
};
