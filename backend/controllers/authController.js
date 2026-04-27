const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { User, Family, FamilyMember } = require('../models');
const sendEmail = require('../services/emailService');
const { success, error: sendError } = require('../utils/responseHelper');

const generateAccessToken = (user) => {
    return jwt.sign(
        { user: { id: user.id, role: user.role } },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '15m' }
    );
};

const generateRefreshToken = (user) => {
    return jwt.sign(
        { user: { id: user.id, role: user.role } },
        process.env.JWT_REFRESH_SECRET || 'refresh_secret_b6d9677116aa4',
        { expiresIn: '7d' }
    );
};

const setRefreshTokenCookie = (res, token) => {
    res.cookie('refresh_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
    });
};

const buildAuthUser = (user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar || null
});

exports.register = async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return sendError(res, 'FILL_ALL_FIELDS', 400);
    }
    if (password.length < 6) {
        return sendError(res, 'PASSWORD_TOO_SHORT', 400);
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return sendError(res, 'INVALID_EMAIL', 400);
    }

    try {
        let user = await User.findOne({ where: { email } });
        if (user) {
            return sendError(res, 'EMAIL_IN_USE', 409);
        }

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        user = await User.create({
            name,
            email,
            password_hash,
            role: 'member'
        });

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
        setRefreshTokenCookie(res, refreshToken);

        success(res, { token: accessToken, user: buildAuthUser(user) }, 'REGISTER_SUCCESS', 201);
    } catch (err) {
        console.error(err.message);
        sendError(res, 'REGISTER_FAILED', 500);
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return sendError(res, 'INVALID_CREDENTIALS', 400);
        }

        if (user.is_locked) {
            return sendError(res, 'ACCOUNT_LOCKED', 403);
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return sendError(res, 'INVALID_CREDENTIALS', 400);
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);
        setRefreshTokenCookie(res, refreshToken);

        success(res, { token: accessToken, user: buildAuthUser(user) }, 'LOGIN_SUCCESS');
    } catch (err) {
        console.error(err.message);
        sendError(res, 'LOGIN_FAILED', 500);
    }
};

exports.refreshToken = async (req, res) => {
    const refreshToken = req.cookies?.refresh_token;

    if (!refreshToken) {
        return sendError(res, 'REFRESH_TOKEN_MISSING', 401);
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'refresh_secret_b6d9677116aa4');
        const user = await User.findByPk(decoded.user.id, {
            attributes: ['id', 'name', 'email', 'role', 'avatar', 'is_locked']
        });

        if (!user) {
            return sendError(res, 'USER_NOT_FOUND', 401);
        }

        if (user.is_locked) {
            return sendError(res, 'ACCOUNT_LOCKED', 403);
        }

        const newAccessToken = generateAccessToken(user);
        success(res, { token: newAccessToken, user: buildAuthUser(user) }, 'REFRESH_SUCCESS');
    } catch (err) {
        console.error('Refresh token error:', err.message);
        sendError(res, 'REFRESH_TOKEN_INVALID', 403);
    }
};

exports.logout = async (req, res) => {
    res.clearCookie('refresh_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    });

    success(res, null, 'LOGOUT_SUCCESS');
};

exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return sendError(res, 'USER_NOT_FOUND', 404);
        }

        const resetToken = crypto.randomBytes(20).toString('hex');
        user.reset_password_token = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.reset_password_expires = Date.now() + 10 * 60 * 1000;

        await user.save();

        const frontendUrl = process.env.VITE_FRONTEND_URL || 'http://localhost:5173';
        const finalResetUrl = `${frontendUrl}/reset-password/${resetToken}`;

        const message = `You received this email because you (or someone else) requested a password reset.\n\nPlease visit the following link to reset your password:\n\n${finalResetUrl}\n\nIf you did not request this, please ignore this email. The token is valid for 10 minutes.`;

        await sendEmail({
            email: user.email,
            subject: 'Password Reset Request - Junkio Expense Tracker',
            message
        });

        success(res, null, 'FORGOT_PASSWORD_SENT');
    } catch (err) {
        console.error(err.message);
        const user = await User.findOne({ where: { email } });
        if (user) {
            user.reset_password_token = null;
            user.reset_password_expires = null;
            await user.save();
        }
        sendError(res, 'EMAIL_SEND_FAILED', 500);
    }
};

exports.resetPassword = async (req, res) => {
    const resetToken = req.params.token;
    const { password } = req.body;

    try {
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        const user = await User.findOne({
            where: {
                reset_password_token: hashedToken,
                reset_password_expires: { [Op.gt]: new Date() }
            }
        });

        if (!user) {
            return sendError(res, 'TOKEN_INVALID_OR_EXPIRED', 400);
        }

        const salt = await bcrypt.genSalt(10);
        user.password_hash = await bcrypt.hash(password, salt);
        user.reset_password_token = null;
        user.reset_password_expires = null;

        await user.save();

        success(res, null, 'RESET_PASSWORD_SUCCESS');
    } catch (err) {
        console.error(err.message);
        sendError(res, 'RESET_PASSWORD_FAILED', 500);
    }
};
