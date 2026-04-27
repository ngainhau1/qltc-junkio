'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.sequelize.query(`
            WITH ranked AS (
                SELECT
                    id,
                    name,
                    ROW_NUMBER() OVER (
                        PARTITION BY "user_id", LOWER("name")
                        ORDER BY "createdAt" ASC, id ASC
                    ) AS rn
                FROM "Wallets"
                WHERE "family_id" IS NULL
                  AND "user_id" IS NOT NULL
            )
            UPDATE "Wallets" w
            SET "name" = CONCAT(w."name", ' (', ranked.rn, ')')
            FROM ranked
            WHERE w.id = ranked.id
              AND ranked.rn > 1;
        `);

        await queryInterface.sequelize.query(`
            WITH ranked AS (
                SELECT
                    id,
                    name,
                    ROW_NUMBER() OVER (
                        PARTITION BY "family_id", LOWER("name")
                        ORDER BY "createdAt" ASC, id ASC
                    ) AS rn
                FROM "Wallets"
                WHERE "family_id" IS NOT NULL
            )
            UPDATE "Wallets" w
            SET "name" = CONCAT(w."name", ' (', ranked.rn, ')')
            FROM ranked
            WHERE w.id = ranked.id
              AND ranked.rn > 1;
        `);

        await queryInterface.sequelize.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS wallets_unique_user_name_ci
            ON "Wallets" ("user_id", LOWER("name"))
            WHERE "family_id" IS NULL;
        `);

        await queryInterface.sequelize.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS wallets_unique_family_name_ci
            ON "Wallets" ("family_id", LOWER("name"))
            WHERE "family_id" IS NOT NULL;
        `);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.sequelize.query('DROP INDEX IF EXISTS wallets_unique_user_name_ci;');
        await queryInterface.sequelize.query('DROP INDEX IF EXISTS wallets_unique_family_name_ci;');
    }
};
