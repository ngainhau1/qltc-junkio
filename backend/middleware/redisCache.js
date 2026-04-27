const { client } = require('../config/redis');

const cacheDashboard = (duration = 300) => {
    return async (req, res, next) => {
        if (process.env.DISABLE_CACHE === 'true') {
            return next();
        }

        const userId = req.user.id;
        const familyId = req.query.family_id || 'personal';
        const context = req.query.context || 'personal';
        const rawKey = `dashboardStats:userId_${userId}:family_${familyId}:context_${context}`;

        try {
            const cachedResponse = await client.get(rawKey);

            if (cachedResponse) {
                console.log(` Redis Cache Hit: ${rawKey}`);
                const data = JSON.parse(cachedResponse);
                return res.status(200).json({
                    success: true,
                    data,
                    message: 'Lấy dữ liệu từ Redis Cache thành công',
                    cached: true
                });
            }

            console.log(` Redis Cache Miss: ${rawKey}. Proceeding to query DB.`);

            const originalSend = res.json.bind(res);
            res.json = (body) => {
                if (body && body.success && body.data) {
                    client.setEx(rawKey, duration, JSON.stringify(body.data))
                        .catch(err => console.error('Redis Set Error:', err));
                }
                originalSend(body);
            };

            next();
        } catch (error) {
            console.error('Redis Middleware Error:', error);
            next();
        }
    };
};

module.exports = { cacheDashboard };
