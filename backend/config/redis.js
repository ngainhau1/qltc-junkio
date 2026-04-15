const redis = require('redis');
require('dotenv').config();

const client = redis.createClient({
    url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`
});

client.on('error', (err) => {
    console.error('Redis connection error:', err);
});

client.on('connect', () => {
    console.log('Connected to Redis Cache Engine Successfully');
});

// Avoid connecting multiple times
let isConnected = false;
const connectRedis = async () => {
    if (!isConnected) {
        await client.connect();
        isConnected = true;
    }
};

module.exports = {
    client,
    connectRedis
};
