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
        return sendError(res, 'Vui long dien day du thong tin', 400);
    }
    if (password.length < 6) {
        return sendError(res, 'Mat khau phai co it nhat 6 ky tu', 400);
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return sendError(res, 'Email khong hop le', 400);
    }

    try {
        let user = await User.findOne({ where: { email } });
        if (user) {
            return sendError(res, 'Email da duoc su dung', 409);
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

        success(res, { token: accessToken, user: buildAuthUser(user) }, 'Dang ky thanh cong', 201);
    } catch (err) {
        console.error(err.message);
        sendError(res, 'Khong the dang ky tai khoan luc nay', 500);
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return sendError(res, 'Email hoac mat khau khong dung', 400);
        }

        if (user.is_locked) {
            return sendError(res, 'Tai khoan da bi khoa', 403);
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return sendError(res, 'Email hoac mat khau khong dung', 400);
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);
        setRefreshTokenCookie(res, refreshToken);

        success(res, { token: accessToken, user: buildAuthUser(user) }, 'Dang nhap thanh cong');
    } catch (err) {
        console.error(err.message);
        sendError(res, 'Khong the dang nhap luc nay', 500);
    }
};

exports.refreshToken = async (req, res) => {
    const refreshToken = req.cookies?.refresh_token;

    if (!refreshToken) {
        return sendError(res, 'Khong tim thay refresh token, vui long dang nhap lai', 401);
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'refresh_secret_b6d9677116aa4');
        const user = await User.findByPk(decoded.user.id, {
            attributes: ['id', 'name', 'email', 'role', 'avatar', 'is_locked']
        });

        if (!user) {
            return sendError(res, 'Nguoi dung khong ton tai', 401);
        }

        if (user.is_locked) {
            return sendError(res, 'Tai khoan da bi khoa', 403);
        }

        const newAccessToken = generateAccessToken(user);
        success(res, { token: newAccessToken, user: buildAuthUser(user) }, 'Lam moi phien dang nhap thanh cong');
    } catch (err) {
        console.error('Refresh token error:', err.message);
        sendError(res, 'Refresh token khong hop le hoac da het han', 403);
    }
};

exports.logout = async (req, res) => {
    res.clearCookie('refresh_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    });

    success(res, null, 'Dang xuat thanh cong');
};

exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return sendError(res, 'Nguoi dung khong ton tai', 404);
        }

        const resetToken = crypto.randomBytes(20).toString('hex');
        user.reset_password_token = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.reset_password_expires = Date.now() + 10 * 60 * 1000;

        await user.save();

        const frontendUrl = process.env.VITE_FRONTEND_URL || 'http://localhost:5173';
        const finalResetUrl = `${frontendUrl}/reset-password/${resetToken}`;

        const message = `Ban nhan duoc email nay vi ban (hoac ai do) da yeu cau dat lai mat khau.\n\nVui long truy cap duong dan sau de dat lai mat khau:\n\n${finalResetUrl}\n\nNeu ban khong yeu cau, vui long bo qua email nay. Token co hieu luc trong 10 phut.`;

        await sendEmail({
            email: user.email,
            subject: 'Yeu cau dat lai mat khau - Junkio Expense Tracker',
            message
        });

        success(res, null, 'Email khoi phuc mat khau da duoc gui');
    } catch (err) {
        console.error(err.message);
        const user = await User.findOne({ where: { email } });
        if (user) {
            user.reset_password_token = null;
            user.reset_password_expires = null;
            await user.save();
        }
        sendError(res, 'Loi gui email', 500);
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
            return sendError(res, 'Token khong hop le hoac da het han', 400);
        }

        const salt = await bcrypt.genSalt(10);
        user.password_hash = await bcrypt.hash(password, salt);
        user.reset_password_token = null;
        user.reset_password_expires = null;

        await user.save();

        success(res, null, 'Mat khau da duoc dat lai thanh cong');
    } catch (err) {
        console.error(err.message);
        sendError(res, 'Khong the dat lai mat khau luc nay', 500);
    }
};
