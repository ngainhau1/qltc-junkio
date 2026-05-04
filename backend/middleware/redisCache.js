const { client } = require('../config/redis');

// Giải quyết 2 bài toán hiệu năng: (1) Tránh nghẽn cổ chai khi lấy dữ liệu từ bên thứ ba (Giá vàng SJC) 
// và (2) Tối ưu hóa các câu truy vấn cơ sở dữ liệu nặng (Thống kê Dashboard).
// Middleware này tự động lo việc bọc Cache bên ngoài, giúp mã nguồn sạch. Controller không cần biết Redis có tồn tại hay không.

const cacheDashboard = (duration = 300) => {
    return async (req, res, next) => {
        if (process.env.DISABLE_CACHE === 'true') {
            return next();
        }

        const userId = req.user.id;
        const familyId = req.query.family_id || 'personal';
        const context = req.query.context || 'personal';
        const startDate = req.query.startDate || 'all';
        const endDate = req.query.endDate || 'all';
        // 1. Tạo Key dựa theo tất cả các bộ lọc của User
        const rawKey = `dashboardStats:userId_${userId}:family_${familyId}:context_${context}:start_${startDate}:end_${endDate}`;

        try {
            //tìm cache
            const cachedResponse = await client.get(rawKey);

            if (cachedResponse) {
                console.log(` Redis Cache Hit: ${rawKey}`);
                const data = JSON.parse(cachedResponse);
                return res.status(200).json({
                    status: 'success',
                    message: 'DASHBOARD_CACHE_HIT',
                    data
                });
            }

            console.log(` Redis Cache Miss: ${rawKey}. Proceeding to query DB.`);
            // 1. Chặn (Intercept) ngõ ra
            const originalSend = res.json.bind(res);
            res.json = (body) => {
                // 2. Kiểm tra điều kiện ghi (phải thành công và có data)
                if (body && (body.status === 'success' || body.success === true) && body.data) {
                    // 3. Set Cache với thời gian sống (TTL)
                    client.setEx(rawKey, duration, JSON.stringify(body.data))
                        .catch(err => console.error('Redis Set Error:', err));
                }
                //trả về dữ liệu về client
                return originalSend(body);
            };
            //chuyển quyền cho controller
            next();
        } catch (error) {
            console.error('Redis Middleware Error:', error);
            next();
        }
    };
};

module.exports = { cacheDashboard };
