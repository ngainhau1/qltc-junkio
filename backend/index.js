const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const { Sequelize } = require('sequelize');
const path = require('path');
const http = require('http'); // Add HTTP module
const socketConfig = require('./config/socket'); // Add Socket config
const responseMiddleware = require('./middleware/responseMiddleware');
const { connectRedis } = require('./utils/redisClient');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const httpServer = http.createServer(app); // Create HTTP server

// Initialize Socket.io
socketConfig.init(httpServer);

// Security: HTTP headers theo chuẩn OWASP (HSTS, X-Frame-Options, CSP...)
app.use(helmet());
app.disable('x-powered-by');

// Rate Limiting Middleware (Bảo vệ chống Brute-force & DDoS)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 1000, // Tăng lên 1000 requests mỗi IP trong 15 phút để dev
    message: 'Quá nhiều yêu cầu , vui lòng thử lại sau 15 phút.'
});

// Middleware
app.use(cors({
    origin: process.env.VITE_FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(responseMiddleware);
app.use('/api', limiter); // Áp dụng cho mọi API

// Phục vụ các file tĩnh trong thư mục uploads (Ví dụ: ảnh đại diện)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/transactions', require('./routes/transactionRoutes'));
app.use('/api/debts', require('./routes/debtRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/wallets', require('./routes/walletRoutes'));
app.use('/api/families', require('./routes/familyRoutes'));
app.use('/api/goals', require('./routes/goalRoutes'));
app.use('/api/recurring', require('./routes/recurringRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/budgets', require('./routes/budgetRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/forecast', require('./routes/forecastRoutes'));

// Swagger API Documentation (truy cập: /api-docs)
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Cấu hình kết nối Database (Lấy từ biến môi trường Docker)
// Lưu ý: 'host' là tên service trong docker-compose ('db')
const sequelize = new Sequelize(
    process.env.DB_NAME || 'expense_tracker_db',
    process.env.DB_USER || 'admin',
    process.env.DB_PASS || 'password123',
    {
        host: process.env.DB_HOST || 'db', // Quan trọng: host phải là 'db'
        dialect: 'postgres',
        logging: process.env.SEQUELIZE_LOG === 'true' ? console.log : false,
        benchmark: process.env.SEQUELIZE_LOG === 'true'
    }
);

// Route kiểm tra server sống hay chết
app.get('/', (req, res) => {
    res.send('<h1> Junkio Expense Tracker Backend is Running!</h1>');
});

// Healthcheck: DB + Redis
app.get('/health', async (req, res) => {
    const result = { status: 'ok', db: 'unknown', redis: 'unknown' };
    try {
        await sequelize.authenticate();
        result.db = 'up';
    } catch (err) {
        result.db = `down: ${err.message}`;
    }
    try {
        await connectRedis();
        await require('./utils/redisClient').client.ping();
        result.redis = 'up';
    } catch (err) {
        result.redis = `down: ${err.message}`;
    }
    const httpStatus = (result.db === 'up' && result.redis === 'up') ? 200 : 503;
    res.status(httpStatus).json(result);
});

// Route kiểm tra kết nối Database (Bảo vệ bởi auth)
app.get('/db-check', require('./middleware/authMiddleware'), async (req, res) => {
    try {
        await sequelize.authenticate();
        res.send(' Kết nối Database thành công!');
    } catch (error) {
        res.status(500).send(' Lỗi kết nối Database: ' + error.message);
    }
});

// Khởi động server (Dùng httpServer thay vì app.listen)
httpServer.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);

    // Thử kết nối DB ngay khi server chạy
    try {
        await sequelize.authenticate();
        console.log(' Database connected successfully!');
        await connectRedis();

        // Khởi chạy hệ thống báo thức giao dịch định kỳ
        const { startCronJobs } = require('./services/cronJobs');
        startCronJobs();
    } catch (error) {
        console.error(' Unable to connect to the database:', error.message);
    }
});
