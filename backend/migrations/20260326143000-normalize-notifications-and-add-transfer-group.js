'use strict';

const NOTIFICATIONS_TABLE = 'notifications';
const TRANSACTIONS_TABLE = 'Transactions';
const USERS_TABLE = 'Users';

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

const hasIndex = async (queryInterface, tableName, indexName) => {
    const indexes = await queryInterface.showIndex(tableName);
    return indexes.some((index) => index.name === indexName);
};

const addIndexIfMissing = async (queryInterface, tableName, fields, options) => {
    if (!(await hasIndex(queryInterface, tableName, options.name))) {
        await queryInterface.addIndex(tableName, fields, options);
    }
};

module.exports = {
    async up(queryInterface, Sequelize) {
        if (!(await hasTable(queryInterface, NOTIFICATIONS_TABLE))) {
            await queryInterface.createTable(NOTIFICATIONS_TABLE, {
                id: {
                    type: Sequelize.UUID,
                    allowNull: false,
                    primaryKey: true,
                    defaultValue: Sequelize.UUIDV4
                },
                type: {
                    type: Sequelize.STRING,
                    allowNull: false
                },
                title: {
                    type: Sequelize.STRING,
                    allowNull: false,
                    defaultValue: 'Notification'
                },
                message: {
                    type: Sequelize.TEXT,
                    allowNull: false
                },
                isRead: {
                    type: Sequelize.BOOLEAN,
                    allowNull: false,
                    defaultValue: false
                },
                user_id: {
                    type: Sequelize.UUID,
                    allowNull: false,
                    references: {
                        model: USERS_TABLE,
                        key: 'id'
                    },
                    onUpdate: 'CASCADE',
                    onDelete: 'CASCADE'
                },
                reference_id: {
                    type: Sequelize.UUID,
                    allowNull: true
                },
                created_at: {
                    type: Sequelize.DATE,
                    allowNull: false,
                    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
                },
                updated_at: {
                    type: Sequelize.DATE,
                    allowNull: false,
                    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
                }
            });
        } else {
            if (!(await hasColumn(queryInterface, NOTIFICATIONS_TABLE, 'title'))) {
                await queryInterface.addColumn(NOTIFICATIONS_TABLE, 'title', {
                    type: Sequelize.STRING,
                    allowNull: false,
                    defaultValue: 'Notification'
                });
            }

            if (!(await hasColumn(queryInterface, NOTIFICATIONS_TABLE, 'reference_id'))) {
                await queryInterface.addColumn(NOTIFICATIONS_TABLE, 'reference_id', {
                    type: Sequelize.UUID,
                    allowNull: true
                });
            }

            if (!(await hasColumn(queryInterface, NOTIFICATIONS_TABLE, 'created_at'))) {
                await queryInterface.addColumn(NOTIFICATIONS_TABLE, 'created_at', {
                    type: Sequelize.DATE,
                    allowNull: true
                });
            }

            if (!(await hasColumn(queryInterface, NOTIFICATIONS_TABLE, 'updated_at'))) {
                await queryInterface.addColumn(NOTIFICATIONS_TABLE, 'updated_at', {
                    type: Sequelize.DATE,
                    allowNull: true
                });
            }

            await queryInterface.sequelize.query(
                `UPDATE "${NOTIFICATIONS_TABLE}"
                 SET "title" = COALESCE(NULLIF(CASE WHEN "title" = 'Notification' THEN NULL ELSE "title" END, ''), "type", 'Notification')
                 WHERE "title" IS NULL OR "title" = '' OR "title" = 'Notification'`
            );
            await queryInterface.sequelize.query(
                `UPDATE "${NOTIFICATIONS_TABLE}"
                 SET "created_at" = COALESCE("created_at", CURRENT_TIMESTAMP),
                     "updated_at" = COALESCE("updated_at", CURRENT_TIMESTAMP)`
            );
        }

        await addIndexIfMissing(queryInterface, NOTIFICATIONS_TABLE, ['user_id'], {
            name: 'notifications_user_id_idx'
        });
        await addIndexIfMissing(queryInterface, NOTIFICATIONS_TABLE, ['user_id', 'type', 'reference_id', 'created_at'], {
            name: 'notifications_budget_dedupe_idx'
        });

        if (await hasTable(queryInterface, TRANSACTIONS_TABLE) && !(await hasColumn(queryInterface, TRANSACTIONS_TABLE, 'transfer_group_id'))) {
            await queryInterface.addColumn(TRANSACTIONS_TABLE, 'transfer_group_id', {
                type: Sequelize.UUID,
                allowNull: true
            });
        }

        if (await hasTable(queryInterface, TRANSACTIONS_TABLE)) {
            await addIndexIfMissing(queryInterface, TRANSACTIONS_TABLE, ['transfer_group_id'], {
                name: 'transactions_transfer_group_id_idx'
            });
        }
    },

    async down(queryInterface) {
        if (await hasTable(queryInterface, TRANSACTIONS_TABLE) && await hasColumn(queryInterface, TRANSACTIONS_TABLE, 'transfer_group_id')) {
            const transferIndexExists = await hasIndex(queryInterface, TRANSACTIONS_TABLE, 'transactions_transfer_group_id_idx');
            if (transferIndexExists) {
                await queryInterface.removeIndex(TRANSACTIONS_TABLE, 'transactions_transfer_group_id_idx');
            }

            await queryInterface.removeColumn(TRANSACTIONS_TABLE, 'transfer_group_id');
        }
    }
};
