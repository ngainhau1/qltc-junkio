const { Sequelize } = require('sequelize');
const migration = require('../migrations/20260326143000-normalize-notifications-and-add-transfer-group');

describe('notification and transfer migration', () => {
    let sequelize;
    let queryInterface;

    const createBaseSchema = async () => {
        await queryInterface.createTable('Users', {
            id: {
                type: Sequelize.UUID,
                allowNull: false,
                primaryKey: true
            }
        });

        await queryInterface.createTable('Transactions', {
            id: {
                type: Sequelize.UUID,
                allowNull: false,
                primaryKey: true
            }
        });
    };

    beforeEach(async () => {
        sequelize = new Sequelize('sqlite::memory:', { logging: false });
        queryInterface = sequelize.getQueryInterface();
    });

    afterEach(async () => {
        await sequelize.close();
    });

    it('creates the notifications table and transfer_group_id on a clean schema', async () => {
        await createBaseSchema();

        await migration.up(queryInterface, Sequelize);

        const notificationSchema = await queryInterface.describeTable('notifications');
        const transactionSchema = await queryInterface.describeTable('Transactions');

        expect(notificationSchema).toHaveProperty('title');
        expect(notificationSchema).toHaveProperty('reference_id');
        expect(notificationSchema).toHaveProperty('created_at');
        expect(notificationSchema).toHaveProperty('updated_at');
        expect(transactionSchema).toHaveProperty('transfer_group_id');
    });

    it('aligns an existing notifications table with missing runtime columns', async () => {
        await createBaseSchema();
        await queryInterface.createTable('notifications', {
            id: {
                type: Sequelize.UUID,
                allowNull: false,
                primaryKey: true
            },
            type: {
                type: Sequelize.STRING,
                allowNull: false
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
                allowNull: false
            }
        });

        await queryInterface.bulkInsert('Users', [{ id: '11111111-1111-4111-8111-111111111111' }]);
        await queryInterface.bulkInsert('notifications', [{
            id: '22222222-2222-4222-8222-222222222222',
            type: 'BUDGET_WARNING',
            message: 'Existing alert',
            isRead: false,
            user_id: '11111111-1111-4111-8111-111111111111'
        }]);

        await migration.up(queryInterface, Sequelize);

        const notificationSchema = await queryInterface.describeTable('notifications');
        const [rows] = await queryInterface.sequelize.query('SELECT title, reference_id, created_at, updated_at FROM notifications');

        expect(notificationSchema).toHaveProperty('title');
        expect(notificationSchema).toHaveProperty('reference_id');
        expect(notificationSchema).toHaveProperty('created_at');
        expect(notificationSchema).toHaveProperty('updated_at');
        expect(rows[0].title).toBe('BUDGET_WARNING');
    });
});
