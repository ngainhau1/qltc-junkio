// Middleware kiểm tra vai trò người dùng
// Sử dụng: router.get('/admin/users', authMiddleware, roleMiddleware('admin'), handler)
module.exports = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(403).json({ message: 'Không có quyền truy cập' });
        }
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Vai trò không đủ quyền' });
        }
        next();
    };
};
