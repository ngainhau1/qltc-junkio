const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Rate Limiting Middleware (Bảo vệ chống Brute-force & DDoS)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 100, // Tối đa 100 requests mỗi IP trong 15 phút
    message: 'Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau 15 phút.'
});

// Middleware
app.use(cors({
    origin: process.env.VITE_FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use('/api', limiter); // Áp dụng cho mọi API

// Phục vụ các file tĩnh trong thư mục uploads (Ví dụ: ảnh đại diện)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/transactions', require('./routes/transactionRoutes'));
app.use('/api/families', require('./routes/familyRoutes'));
app.use('/api/export', require('./routes/exportRoutes'));
app.use('/api/debts', require('./routes/debtRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

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

        // Khởi chạy hệ thống báo thức giao dịch định kỳ
        const { startCronJobs } = require('./services/cronJobs');
        startCronJobs();
    } catch (error) {
        console.error('❌ Unable to connect to the database:', error.message);
    }
});