'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('transaction_shares', 'approval_status', {
            type: Sequelize.STRING,
            defaultValue: 'PENDING',
            allowNull: false
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('transaction_shares', 'approval_status');
    }
};
