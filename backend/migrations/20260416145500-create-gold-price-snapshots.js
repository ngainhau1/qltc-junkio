'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('gold_price_snapshots', {
            id: {
                allowNull: false,
                primaryKey: true,
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
            },
            source: {
                allowNull: false,
                type: Sequelize.STRING,
            },
            branch: {
                allowNull: false,
                type: Sequelize.STRING,
            },
            product_name: {
                allowNull: false,
                type: Sequelize.STRING,
            },
            buy: {
                allowNull: false,
                type: Sequelize.DECIMAL(15, 2),
            },
            sell: {
                allowNull: false,
                type: Sequelize.DECIMAL(15, 2),
            },
            currency: {
                allowNull: false,
                type: Sequelize.STRING,
            },
            unit: {
                allowNull: false,
                type: Sequelize.STRING,
            },
            data_origin: {
                allowNull: false,
                type: Sequelize.STRING,
                defaultValue: 'live',
            },
            captured_at: {
                allowNull: false,
                type: Sequelize.DATE,
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE,
            },
        });

        await queryInterface.addIndex(
            'gold_price_snapshots',
            ['source', 'branch', 'product_name', 'captured_at', 'data_origin'],
            {
                unique: true,
                name: 'gold_price_snapshots_unique_capture_origin',
            }
        );
    },

    async down(queryInterface) {
        await queryInterface.removeIndex('gold_price_snapshots', 'gold_price_snapshots_unique_capture_origin');
        await queryInterface.dropTable('gold_price_snapshots');
    },
};
