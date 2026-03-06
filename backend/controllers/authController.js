const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User, Family, FamilyMember } = require('../models');

// Helpers for Token Generation
const generateAccessToken = (user) => {
    return jwt.sign(
        { user: { id: user.id } },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '15m' } // Hết hạn ngắn
    );
};

const generateRefreshToken = (user) => {
    return jwt.sign(
        { user: { id: user.id } },
        process.env.JWT_REFRESH_SECRET || 'refresh_secret_b6d9677116aa4',
        { expiresIn: '7d' } // Hết hạn dài
    );
};

const setRefreshTokenCookie = (res, token) => {
    res.cookie('refresh_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 ngày
    });
};

exports.register = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        let user = await User.findOne({ where: { email } });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        user = await User.create({
            name,
            email,
            password_hash,
            role: 'member'
        });

        // Auto Create a default family for the user
        const family = await Family.create({
            name: `${name}'s Family`,
            owner_id: user.id
        });

        await FamilyMember.create({
            family_id: family.id,
            user_id: user.id,
            role: 'owner'
        });

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        // TODO: Mở rộng, lưu refresh token vào database ở bảng refresh_tokens nếu cần blacklist

        setRefreshTokenCookie(res, refreshToken);

        res.json({ token: accessToken, user: { id: user.id, name: user.name, email: user.email } });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        let user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        // TODO: Lưu refresh token vào DB nếu cần tracking device/revoke

        setRefreshTokenCookie(res, refreshToken);

        res.json({ token: accessToken, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.refreshToken = async (req, res) => {
    const refreshToken = req.cookies?.refresh_token;

    if (!refreshToken) {
        return res.status(401).json({ msg: 'No refresh token provided, please log in' });
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'refresh_secret_b6d9677116aa4');

        // Generate new access token
        const newAccessToken = generateAccessToken({ id: decoded.user.id });

        res.json({ token: newAccessToken });
    } catch (err) {
        console.error('Refresh token error:', err.message);
        res.status(403).json({ msg: 'Invalid or expired refresh token' });
    }
};

exports.getMe = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password_hash'] }
        });
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
