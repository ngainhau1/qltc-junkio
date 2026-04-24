const { Sequelize } = require('sequelize');
const migration = require('../migrations/20260416145500-create-gold-price-snapshots');

describe('gold price snapshots migration', () => {
    let sequelize;
    let queryInterface;

    beforeEach(async () => {
        sequelize = new Sequelize('sqlite::memory:', { logging: false });
        queryInterface = sequelize.getQueryInterface();
    });

    afterEach(async () => {
        await sequelize.close();
    });

    it('creates the gold_price_snapshots table with the seeded/live uniqueness index', async () => {
        await migration.up(queryInterface, Sequelize);

        const tableSchema = await queryInterface.describeTable('gold_price_snapshots');
        const indexes = await queryInterface.showIndex('gold_price_snapshots');
        const uniqueIndex = indexes.find((index) => index.name === 'gold_price_snapshots_unique_capture_origin');

        expect(tableSchema).toHaveProperty('data_origin');
        expect(tableSchema).toHaveProperty('captured_at');
        expect(uniqueIndex).toBeTruthy();
        expect(uniqueIndex.fields.map((field) => field.attribute)).toEqual([
            'source',
            'branch',
            'product_name',
            'captured_at',
            'data_origin',
        ]);
    });

    it('drops the gold_price_snapshots table on rollback', async () => {
        await migration.up(queryInterface, Sequelize);
        await migration.down(queryInterface);

        await expect(queryInterface.describeTable('gold_price_snapshots')).rejects.toThrow();
    });
});
