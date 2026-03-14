const { createClient } = require('redis');

const redisUrl = {
    socket: {
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: Number(process.env.REDIS_PORT) || 6379
    }
};

const client = createClient(redisUrl);

client.on('error', (err) => {
    console.error('Redis Client Error:', err.message);
});

let isReady = false;

const connectRedis = async () => {
    if (isReady) return client;
    try {
        await client.connect();
        isReady = true;
        console.log('Redis connected');
    } catch (err) {
        console.error('Redis connection failed:', err.message);
    }
    return client;
};

module.exports = { client, connectRedis };
