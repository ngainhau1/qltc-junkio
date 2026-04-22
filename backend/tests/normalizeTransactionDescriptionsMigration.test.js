const { Sequelize, DataTypes } = require('sequelize');
const migration = require('../migrations/20260422120000-normalize-transaction-descriptions');

describe('normalize transaction descriptions migration', () => {
    let sequelize;
    let queryInterface;

    beforeEach(async () => {
        sequelize = new Sequelize('sqlite::memory:', { logging: false });
        queryInterface = sequelize.getQueryInterface();

        await queryInterface.createTable('Users', {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                allowNull: false
            },
            name: {
                type: DataTypes.STRING,
                allowNull: true
            },
            email: {
                type: DataTypes.STRING,
                allowNull: true
            },
            createdAt: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updatedAt: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }
        });

        await queryInterface.createTable('Transactions', {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                allowNull: false
            },
            description: {
                type: DataTypes.STRING,
                allowNull: true
            },
            type: {
                type: DataTypes.STRING,
                allowNull: false
            },
            createdAt: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updatedAt: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }
        });
    });

    afterEach(async () => {
        await sequelize.close();
    });

    it('replaces UUID-based transfer descriptions with normalized user and wallet labels', async () => {
        const debtorId = '11111111-1111-1111-1111-111111111111';
        const walletName = 'Vi chinh';

        await queryInterface.bulkInsert('Users', [{
            id: debtorId,
            name: 'Nguyen Van A',
            email: 'a@example.com',
            createdAt: new Date(),
            updatedAt: new Date()
        }]);

        await queryInterface.bulkInsert('Transactions', [
            {
                id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
                description: `Tra no cho user ${debtorId}`,
                type: 'TRANSFER_OUT',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
                description: `Nhan tien tra no tu ${debtorId}`,
                type: 'TRANSFER_IN',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
                description: `Chuyen tien toi vi ${walletName}`,
                type: 'TRANSFER_OUT',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4',
                description: `Nhan tien tu vi ${walletName}`,
                type: 'TRANSFER_IN',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5',
                description: 'Mo ta do nguoi dung tu nhap',
                type: 'EXPENSE',
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ]);

        await migration.up(queryInterface);

        const [rows] = await sequelize.query(
            'SELECT "id", "description" FROM "Transactions" ORDER BY "id" ASC'
        );

        expect(rows).toEqual([
            {
                id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
                description: 'Tr\u1ea3 n\u1ee3 cho Nguyen Van A'
            },
            {
                id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
                description: 'Nh\u1eadn ti\u1ec1n tr\u1ea3 n\u1ee3 t\u1eeb Nguyen Van A'
            },
            {
                id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
                description: 'Chuy\u1ec3n ti\u1ec1n t\u1edbi v\u00ed Vi chinh'
            },
            {
                id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4',
                description: 'Nh\u1eadn ti\u1ec1n t\u1eeb v\u00ed Vi chinh'
            },
            {
                id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5',
                description: 'Mo ta do nguoi dung tu nhap'
            }
        ]);
    });

    it('does nothing when the required tables are missing', async () => {
        await queryInterface.dropTable('Transactions');

        await expect(migration.up(queryInterface)).resolves.toBeUndefined();
    });
});
