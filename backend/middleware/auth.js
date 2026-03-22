const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET || (process.env.NODE_ENV === 'test' ? 'test-secret' : undefined);

module.exports = (req, res, next) => {
    if (!jwtSecret) {
        return res.status(500).json({ msg: 'Server missing JWT secret' });
    }
    // Get token from header
    const token = req.header('x-auth-token');

    // Check if not token
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    // Verify token
    try {
        const decoded = jwt.verify(token, jwtSecret);
        req.user = decoded.user;
        next();
    } catch (err) {
        console.error('Auth token verification failed:', err.message);
        res.status(401).json({ msg: 'Token is not valid' });
    }
};
