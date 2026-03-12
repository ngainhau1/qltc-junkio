'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
    // Thêm cột approval_status vào bảng transaction_shares
        await queryInterface.addColumn('transaction_shares', 'approval_status', {
            type: Sequelize.STRING,
            defaultValue: 'PENDING',
            allowNull: false
        });
    },

    down: async (queryInterface, Sequelize) => {
    // Hoàn tác: xóa cột
        await queryInterface.removeColumn('transaction_shares', 'approval_status');
    }
};
