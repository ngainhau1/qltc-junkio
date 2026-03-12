const { Transaction } = require('../models');
const { Op, fn, col, literal } = require('sequelize');

// GET /api/forecast?months=3
// Dự báo dòng tiền dựa trên lịch sử 6 tháng — Linear Regression y = ax + b
exports.getForecast = async (req, res) => {
    try {
        const userId = req.user.id;
        const months = parseInt(req.query.months) || 3;

        // Lấy dữ liệu 6 tháng gần nhất, nhóm theo tháng
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlyData = await Transaction.findAll({
            where: { user_id: userId, date: { [Op.gte]: sixMonthsAgo } },
            attributes: [
                [fn('date_trunc', 'month', col('date')), 'month'],
                [fn('SUM', literal('CASE WHEN type=\'INCOME\' THEN amount ELSE 0 END')), 'income'],
                [fn('SUM', literal('CASE WHEN type=\'EXPENSE\' THEN amount ELSE 0 END')), 'expense'],
            ],
            group: [fn('date_trunc', 'month', col('date'))],
            order: [[fn('date_trunc', 'month', col('date')), 'ASC']],
            raw: true
        });

        // Linear Regression: y = ax + b
        const linearRegression = (data) => {
            const n = data.length;
            if (n < 2) return { predict: (x) => data[0]?.y || 0 };
            const sumX = data.reduce((s, d) => s + d.x, 0);
            const sumY = data.reduce((s, d) => s + d.y, 0);
            const sumXY = data.reduce((s, d) => s + d.x * d.y, 0);
            const sumX2 = data.reduce((s, d) => s + d.x * d.x, 0);
            const denominator = n * sumX2 - sumX * sumX;
            const a = denominator !== 0 ? (n * sumXY - sumX * sumY) / denominator : 0;
            const b = (sumY - a * sumX) / n;
            return { a, b, predict: (x) => Math.max(0, Math.round((a * x + b) * 100) / 100) };
        };

        const incomes = monthlyData.map((d, i) => ({ x: i, y: parseFloat(d.income) || 0 }));
        const expenses = monthlyData.map((d, i) => ({ x: i, y: parseFloat(d.expense) || 0 }));

        const incomeModel = linearRegression(incomes);
        const expenseModel = linearRegression(expenses);

        // Dự báo N tháng tới
        const forecast = [];
        for (let i = 1; i <= months; i++) {
            const futureDate = new Date();
            futureDate.setMonth(futureDate.getMonth() + i);
            const predictedIncome = incomeModel.predict(monthlyData.length + i - 1);
            const predictedExpense = expenseModel.predict(monthlyData.length + i - 1);
            forecast.push({
                month: futureDate.toISOString().slice(0, 7),
                predictedIncome,
                predictedExpense,
                predictedNet: Math.round((predictedIncome - predictedExpense) * 100) / 100
            });
        }

        // Cảnh báo nếu chi > thu trong tương lai
        const warningMonth = forecast.find(f => f.predictedNet < 0);

        res.json({
            historical: monthlyData,
            forecast,
            warningMonth: warningMonth ? warningMonth.month : null
        });
    } catch (error) {
        console.error('Forecast error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
