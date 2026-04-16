const { client } = require('../config/redis');

/**
 * Middleware: Caching HTTP Responses using Redis
 * @param {number} duration Expiration time in seconds
 */
const cacheDashboard = (duration = 300) => {
    return async (req, res, next) => {
        // Skip caching if cache mechanism is disabled (e.g. for testing)
        if (process.env.DISABLE_CACHE === 'true') {
            return next();
        }

        // Construct a unique cache key for each user and their query context
        const userId = req.user.id;
        const familyId = req.query.family_id || 'personal';
        const context = req.query.context || 'personal';
        const rawKey = `dashboardStats:userId_${userId}:family_${familyId}:context_${context}`;

        try {
            // Check if Redis has cached data
            const cachedResponse = await client.get(rawKey);

            if (cachedResponse) {
                console.log(`⚡ Redis Cache Hit: ${rawKey}`);
                const data = JSON.parse(cachedResponse);
                return res.status(200).json({
                    success: true,
                    data,
                    message: 'Lấy dữ liệu từ Redis Cache thành công',
                    cached: true
                });
            }

            console.log(` Redis Cache Miss: ${rawKey}. Proceeding to query DB.`);

            // Hijack the res.send method to trap the controller's response
            // so we can store it in Redis before returning it to the user.
            const originalSend = res.json.bind(res);
            res.json = (body) => {
                // If the controller reports success, cache the data payload
                if (body && body.success && body.data) {
                    client.setEx(rawKey, duration, JSON.stringify(body.data))
                        .catch(err => console.error('Redis Set Error:', err));
                }
                originalSend(body);
            };

            next();
        } catch (error) {
            console.error('Redis Middleware Error:', error);
            // If Redis fails, gracefully failover to Database query
            next();
        }
    };
};

module.exports = { cacheDashboard };
