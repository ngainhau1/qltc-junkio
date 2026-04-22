'use strict';

const SHARES_TABLE = 'transaction_shares';

const getTableName = (table) => {
    if (typeof table === 'string') {
        return table;
    }

    return table.tableName || table.name || '';
};

const hasTable = async (queryInterface, tableName) => {
    const tables = await queryInterface.showAllTables();
    return tables.map(getTableName).includes(tableName);
};

const hasColumn = async (queryInterface, tableName, columnName) => {
    const schema = await queryInterface.describeTable(tableName);
    return Object.prototype.hasOwnProperty.call(schema, columnName);
};

module.exports = {
    async up(queryInterface, Sequelize) {
        if (
            !(await hasTable(queryInterface, SHARES_TABLE)) ||
            !(await hasColumn(queryInterface, SHARES_TABLE, 'approval_status'))
        ) {
            return;
        }

        await queryInterface.sequelize.transaction(async (transaction) => {
            await queryInterface.sequelize.query(
                `UPDATE "${SHARES_TABLE}"
                 SET "approval_status" = 'APPROVED',
                     "updated_at" = CURRENT_TIMESTAMP
                 WHERE "approval_status" = 'PENDING'
                   AND ("status" IS NULL OR "status" <> 'PAID')`,
                { transaction }
            );

            await queryInterface.changeColumn(
                SHARES_TABLE,
                'approval_status',
                {
                    type: Sequelize.STRING,
                    defaultValue: 'APPROVED',
                    allowNull: false
                },
                { transaction }
            );
        });
    },

    async down(queryInterface, Sequelize) {
        if (
            !(await hasTable(queryInterface, SHARES_TABLE)) ||
            !(await hasColumn(queryInterface, SHARES_TABLE, 'approval_status'))
        ) {
            return;
        }

        await queryInterface.changeColumn(SHARES_TABLE, 'approval_status', {
            type: Sequelize.STRING,
            defaultValue: 'PENDING',
            allowNull: false
        });
    }
};
