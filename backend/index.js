const express = require('express');
const cors = require('cors');
const { Sequelize } = require('sequelize');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));

// Cấu hình kết nối Database (Lấy từ biến môi trường Docker)
// Lưu ý: 'host' là tên service trong docker-compose ('db')
const sequelize = new Sequelize(
    process.env.DB_NAME || 'expense_tracker_db',
    process.env.DB_USER || 'admin',
    process.env.DB_PASS || 'password123',
    {
        host: process.env.DB_HOST || 'db', // Quan trọng: host phải là 'db'
        dialect: 'postgres',
        logging: false, // Tắt log SQL cho gọn
    }
);

// Route kiểm tra server sống hay chết
app.get('/', (req, res) => {
    res.send('<h1>🚀 Junkio Expense Tracker Backend is Running!</h1>');
});

// Route kiểm tra kết nối Database
app.get('/db-check', async (req, res) => {
    try {
        await sequelize.authenticate();
        res.send('✅ Kết nối Database thành công!');
    } catch (error) {
        res.status(500).send('❌ Lỗi kết nối Database: ' + error.message);
    }
});

// Khởi động server
app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);

    // Thử kết nối DB ngay khi server chạy
    try {
        await sequelize.authenticate();
        console.log('✅ Database connected successfully!');
    } catch (error) {
        console.error('❌ Unable to connect to the database:', error.message);
    }
});