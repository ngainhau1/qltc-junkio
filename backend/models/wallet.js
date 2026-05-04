'use strict';

const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    /**
     * Wallet dai dien cho mot "nguon tien" trong he thong.
     *
     * Co 2 loai vi chinh:
     * - Vi ca nhan: co `user_id`, `family_id = null`.
     * - Vi gia dinh: co `family_id`, thuong khong gan truc tiep voi `user_id`.
     *
     * Nhieu controller/service dua vao cap truong `user_id` va `family_id`
     * de quyet dinh ngu canh truy cap, vi vay khong nen tu y doi y nghia
     * hai truong nay neu chua cap nhat accessScope va cac validator lien quan.
     */
    class Wallet extends Model {
        static associate(models) {
            // Vi ca nhan thuoc ve mot user cu the. Vi family co the khong co user_id.
            Wallet.belongsTo(models.User, { foreignKey: 'user_id' });

            // Vi gia dinh thuoc ve mot Family; dung cho ngan sach/giao dich chung.
            Wallet.belongsTo(models.Family, { foreignKey: 'family_id' });

            // Moi giao dich luon gan voi mot vi de co the cap nhat/rollback so du.
            Wallet.hasMany(models.Transaction, { foreignKey: 'wallet_id' });
        }
    }
    Wallet.init({
        // UUID giup tranh lo id khi import/seed nhieu moi truong.
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        // Ten hien thi cua vi, vi du "Vi tien mat", "MB Bank", "Quy gia dinh".
        name: DataTypes.STRING,

        // So du hien tai. Controller giao dich chiu trach nhiem cong/tru va rollback.
        balance: DataTypes.DECIMAL,

        // Don vi tien te cua vi. Phan lon demo su dung VND.
        currency: DataTypes.STRING,

        // Co gia tri voi vi ca nhan; null voi vi gia dinh.
        user_id: DataTypes.UUID,

        // Co gia tri voi vi gia dinh; null voi vi ca nhan.
        family_id: DataTypes.UUID
    }, {
        sequelize,
        modelName: 'Wallet',
    });
    return Wallet;
};
