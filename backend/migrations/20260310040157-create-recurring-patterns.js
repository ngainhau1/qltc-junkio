'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('RecurringPatterns', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false
      },
      wallet_id: {
        type: Sequelize.UUID,
        allowNull: false
      },
      category_id: {
        type: Sequelize.UUID,
        allowNull: true
      },
      amount: {
        type: Sequelize.DECIMAL,
        allowNull: false
      },
      type: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.STRING
      },
      frequency: {
        type: Sequelize.STRING,
        allowNull: false
      },
      next_run_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        field: 'created_at'
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        field: 'updated_at'
      }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('RecurringPatterns');
  }
};
