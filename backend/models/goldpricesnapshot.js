'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class GoldPriceSnapshot extends Model {}

    GoldPriceSnapshot.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        source: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        branch: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        productName: {
            type: DataTypes.STRING,
            allowNull: false,
            field: 'product_name',
        },
        buy: {
            type: DataTypes.DECIMAL,
            allowNull: false,
        },
        sell: {
            type: DataTypes.DECIMAL,
            allowNull: false,
        },
        currency: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        unit: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        dataOrigin: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'live',
            field: 'data_origin',
        },
        capturedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            field: 'captured_at',
        },
    }, {
        sequelize,
        modelName: 'GoldPriceSnapshot',
        tableName: 'gold_price_snapshots',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    });

    return GoldPriceSnapshot;
};
