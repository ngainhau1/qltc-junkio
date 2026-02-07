require('dotenv').config();

module.exports = {
    development: {
        username: process.env.DB_USER || 'admin',
        password: process.env.DB_PASS || 'password123',
        database: process.env.DB_NAME || 'expense_tracker_db',
        host: process.env.DB_HOST || 'localhost', // Default to localhost for local dev if not in docker
        dialect: 'postgres',
        logging: false
    },
    test: {
        username: process.env.DB_USER || 'admin',
        password: process.env.DB_PASS || 'password123',
        database: process.env.DB_NAME || 'expense_tracker_db_test',
        host: process.env.DB_HOST || 'localhost',
        dialect: 'postgres'
    },
    production: {
        username: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        host: process.env.DB_HOST,
        dialect: 'postgres'
    }
};
