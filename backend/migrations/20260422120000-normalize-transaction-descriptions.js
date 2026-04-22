'use strict';

const TRANSACTIONS_TABLE = 'Transactions';
const USERS_TABLE = 'Users';

const DEBT_OUT_DESCRIPTION_PATTERN = /^Tra no cho user ([0-9a-f-]{36})$/i;
const DEBT_IN_DESCRIPTION_PATTERN = /^Nhan tien tra no tu ([0-9a-f-]{36})$/i;
const TRANSFER_OUT_DESCRIPTION_PATTERN = /^Chuyen tien toi vi (.+)$/i;
const TRANSFER_IN_DESCRIPTION_PATTERN = /^Nhan tien tu vi (.+)$/i;

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

const getUserLabel = (usersById, userId) => {
    const user = usersById.get(String(userId).toLowerCase());

    if (!user) {
        return 'người dùng';
    }

    return user.name || user.email || 'người dùng';
};

const getNormalizedDescription = (row, usersById) => {
    const { description, type } = row;

    if (!description) {
        return null;
    }

    const debtOutMatch = description.match(DEBT_OUT_DESCRIPTION_PATTERN);
    if (type === 'TRANSFER_OUT' && debtOutMatch) {
        return `Trả nợ cho ${getUserLabel(usersById, debtOutMatch[1])}`;
    }

    const debtInMatch = description.match(DEBT_IN_DESCRIPTION_PATTERN);
    if (type === 'TRANSFER_IN' && debtInMatch) {
        return `Nhận tiền trả nợ từ ${getUserLabel(usersById, debtInMatch[1])}`;
    }

    const transferOutMatch = description.match(TRANSFER_OUT_DESCRIPTION_PATTERN);
    if (type === 'TRANSFER_OUT' && transferOutMatch) {
        return `Chuyển tiền tới ví ${transferOutMatch[1]}`;
    }

    const transferInMatch = description.match(TRANSFER_IN_DESCRIPTION_PATTERN);
    if (type === 'TRANSFER_IN' && transferInMatch) {
        return `Nhận tiền từ ví ${transferInMatch[1]}`;
    }

    return null;
};

module.exports = {
    async up(queryInterface) {
        if (!(await hasTable(queryInterface, TRANSACTIONS_TABLE)) || !(await hasTable(queryInterface, USERS_TABLE))) {
            return;
        }

        await queryInterface.sequelize.transaction(async (transaction) => {
            const [users] = await queryInterface.sequelize.query(
                `SELECT "id", "name", "email" FROM "${USERS_TABLE}"`,
                { transaction }
            );
            const usersById = new Map(users.map((user) => [String(user.id).toLowerCase(), user]));
            const [transactions] = await queryInterface.sequelize.query(
                `SELECT "id", "description", "type"
                 FROM "${TRANSACTIONS_TABLE}"
                 WHERE "description" IS NOT NULL`,
                { transaction }
            );

            for (const row of transactions) {
                const normalizedDescription = getNormalizedDescription(row, usersById);

                if (!normalizedDescription || normalizedDescription === row.description) {
                    continue;
                }

                await queryInterface.sequelize.query(
                    `UPDATE "${TRANSACTIONS_TABLE}"
                     SET "description" = :description,
                         "updatedAt" = CURRENT_TIMESTAMP
                     WHERE "id" = :id`,
                    {
                        replacements: {
                            description: normalizedDescription,
                            id: row.id
                        },
                        transaction
                    }
                );
            }
        });
    },

    async down() {
        // Normalized descriptions include user names and cannot be safely reversed to UUID-based text.
    }
};
