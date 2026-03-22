const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET || (process.env.NODE_ENV === 'test' ? 'test-secret' : undefined);

const authMiddleware = (req, res, next) => {
    if (!jwtSecret) {
        return res.status(500).json({ message: 'Server missing JWT secret' });
    }
    // Get token from the header (Authorization: Bearer <token>)
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // Verify token
        const decoded = jwt.verify(token, jwtSecret);

        // Add user string/object from payload
        req.user = decoded.user;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token has expired' });
        }
        res.status(401).json({ message: 'Token is not valid' });
    }
};

module.exports = authMiddleware;
