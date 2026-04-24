const { Sequelize, DataTypes } = require('sequelize');
const migration = require('../migrations/20260422121000-normalize-transaction-share-approval-status');

describe('normalize transaction share approval status migration', () => {
    let sequelize;
    let queryInterface;

    beforeEach(async () => {
        sequelize = new Sequelize('sqlite::memory:', { logging: false });
        queryInterface = sequelize.getQueryInterface();

        await queryInterface.createTable('transaction_shares', {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                allowNull: false
            },
            transaction_id: {
                type: DataTypes.UUID,
                allowNull: false
            },
            user_id: {
                type: DataTypes.UUID,
                allowNull: false
            },
            amount: {
                type: DataTypes.DECIMAL,
                allowNull: false
            },
            status: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: 'UNPAID'
            },
            approval_status: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: 'PENDING'
            },
            created_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updated_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }
        });
    });

    afterEach(async () => {
        await sequelize.close();
    });

    it('promotes unpaid pending shares to APPROVED and updates the column default', async () => {
        await queryInterface.bulkInsert('transaction_shares', [
            {
                id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
                transaction_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
                user_id: 'cccccccc-cccc-cccc-cccc-ccccccccccc1',
                amount: 100000,
                status: 'UNPAID',
                approval_status: 'PENDING',
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
                transaction_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
                user_id: 'cccccccc-cccc-cccc-cccc-ccccccccccc2',
                amount: 100000,
                status: 'PAID',
                approval_status: 'PENDING',
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
                transaction_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3',
                user_id: 'cccccccc-cccc-cccc-cccc-ccccccccccc3',
                amount: 100000,
                status: 'UNPAID',
                approval_status: 'REJECTED',
                created_at: new Date(),
                updated_at: new Date()
            }
        ]);

        await migration.up(queryInterface, Sequelize);

        const [rows] = await sequelize.query(
            'SELECT "id", "status", "approval_status" FROM "transaction_shares" ORDER BY "id" ASC'
        );
        const schema = await queryInterface.describeTable('transaction_shares');

        expect(rows).toEqual([
            {
                id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
                status: 'UNPAID',
                approval_status: 'APPROVED'
            },
            {
                id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
                status: 'PAID',
                approval_status: 'PENDING'
            },
            {
                id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
                status: 'UNPAID',
                approval_status: 'REJECTED'
            }
        ]);
        expect(schema.approval_status.defaultValue).toBe('APPROVED');
    });

    it('restores the default to PENDING on rollback', async () => {
        await migration.up(queryInterface, Sequelize);
        await migration.down(queryInterface, Sequelize);

        const schema = await queryInterface.describeTable('transaction_shares');
        expect(schema.approval_status.defaultValue).toBe('PENDING');
    });
});
