const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const { Sequelize } = require('sequelize');
const path = require('path');
const http = require('http');
const socketConfig = require('./config/socket');
const responseMiddleware = require('./middleware/responseMiddleware');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const httpServer = http.createServer(app);

socketConfig.init(httpServer);

app.use(helmet());
app.disable('x-powered-by');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: 'Quá nhiều yêu cầu , vui lòng thử lại sau 15 phút.'
});

app.use(cors({
    origin: process.env.VITE_FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(responseMiddleware);
app.use('/api', limiter);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
app.use('/api/market', require('./routes/marketRoutes'));

const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
app.use('/swagger-assets', express.static(path.join(__dirname, 'public', 'swagger')));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customJs: '/swagger-assets/swagger-custom.js',
    swaggerOptions: {
        persistAuthorization: true
    }
}));

const sequelize = new Sequelize(
    process.env.DB_NAME || 'expense_tracker_db',
    process.env.DB_USER || 'admin',
    process.env.DB_PASS || 'password123',
    {
        host: process.env.DB_HOST || 'db',
        dialect: 'postgres',
        logging: process.env.SEQUELIZE_LOG === 'true' ? console.log : false,
        benchmark: process.env.SEQUELIZE_LOG === 'true'
    }
);

app.get('/', (req, res) => {
    res.send('<h1> Junkio Expense Tracker Backend is Running!</h1>');
});

app.get('/health', async (req, res) => {
    const result = { status: 'ok', db: 'unknown', redis: 'unknown' };
    try {
        await sequelize.authenticate();
        result.db = 'up';
    } catch (err) {
        result.db = `down: ${err.message}`;
    }
    try {
        const { connectRedis, client } = require('./config/redis');
        await connectRedis();
        await client.ping();
        result.redis = 'up';
    } catch (err) {
        result.redis = `down: ${err.message}`;
    }
    const httpStatus = (result.db === 'up' && result.redis === 'up') ? 200 : 503;
    res.status(httpStatus).json(result);
});

app.get('/db-check', require('./middleware/authMiddleware'), async (req, res) => {
    try {
        await sequelize.authenticate();
        res.send(' Kết nối Database thành công!');
    } catch (error) {
        res.status(500).send(' Lỗi kết nối Database: ' + error.message);
    }
});

httpServer.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);

    try {
        await sequelize.authenticate();
        console.log(' Database connected successfully!');

        const { connectRedis } = require('./config/redis');
        await connectRedis();

        const { startCronJobs } = require('./services/cronJobs');
        startCronJobs();
    } catch (error) {
        console.error(' Startup connection error:', error.message);
    }
});
