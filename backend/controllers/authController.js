const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { User, Family, FamilyMember } = require('../models');
const sendEmail = require('../services/emailService');
const { success, error: sendError } = require('../utils/responseHelper');

// Helpers for Token Generation
const generateAccessToken = (user) => {
    return jwt.sign(
        { user: { id: user.id, role: user.role } },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '15m' } // Hết hạn ngắn
    );
};

const generateRefreshToken = (user) => {
    return jwt.sign(
        { user: { id: user.id, role: user.role } },
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

    // Security: Input validation
    if (!name || !email || !password) {
        return sendError(res, 'Vui lòng điền đầy đủ thông tin', 400);
    }
    if (password.length < 6) {
        return sendError(res, 'Mật khẩu phải có ít nhất 6 ký tự', 400);
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return sendError(res, 'Email không hợp lệ', 400);
    }

    try {
        let user = await User.findOne({ where: { email } });
        if (user) {
            return sendError(res, 'User already exists', 400);
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

        success(res, { token: accessToken, user: { id: user.id, name: user.name, email: user.email } }, 'Đăng ký thành công', 201);
    } catch (err) {
        console.error(err.message);
        sendError(res, 'Server error', 500);
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        let user = await User.findOne({ where: { email } });
        if (!user) {
            return sendError(res, 'Invalid Credentials', 400);
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return sendError(res, 'Invalid Credentials', 400);
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        // TODO: Lưu refresh token vào DB nếu cần tracking device/revoke

        setRefreshTokenCookie(res, refreshToken);

        success(res, { token: accessToken, user: { id: user.id, name: user.name, email: user.email, role: user.role } }, 'Đăng nhập thành công');
    } catch (err) {
        console.error(err.message);
        sendError(res, 'Server error', 500);
    }
};

exports.refreshToken = async (req, res) => {
    const refreshToken = req.cookies?.refresh_token;

    if (!refreshToken) {
        return sendError(res, 'No refresh token provided, please log in', 401);
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'refresh_secret_b6d9677116aa4');

        // Generate new access token
        const newAccessToken = generateAccessToken({ id: decoded.user.id });

        success(res, { token: newAccessToken }, 'Lấy token mới thành công');
    } catch (err) {
        console.error('Refresh token error:', err.message);
        sendError(res, 'Invalid or expired refresh token', 403);
    }
};



exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return sendError(res, 'Người dùng không tồn tại', 404);
        }

        const resetToken = crypto.randomBytes(20).toString('hex');
        user.reset_password_token = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.reset_password_expires = Date.now() + 10 * 60 * 1000; // 10 minutes

        await user.save();

        const frontendUrl = process.env.VITE_FRONTEND_URL || 'http://localhost:5173';
        const finalResetUrl = `${frontendUrl}/reset-password/${resetToken}`;

        const message = `Bạn nhận được email này vì bạn (hoặc ai đó) đã yêu cầu lấy lại mật khẩu.\n\nVui lòng truy cập đường dẫn sau để đặt lại mật khẩu:\n\n${finalResetUrl}\n\nNếu bạn không yêu cầu, vui lòng bỏ qua email này. Token có hiệu lực trong 10 phút.`;

        await sendEmail({
            email: user.email,
            subject: 'Yêu cầu đặt lại mật khẩu - Junkio Expense Tracker',
            message
        });

        success(res, null, 'Email khôi phục mật khẩu đã được gửi');
    } catch (err) {
        console.error(err.message);
        const user = await User.findOne({ where: { email } });
        if (user) {
            user.reset_password_token = null;
            user.reset_password_expires = null;
            await user.save();
        }
        sendError(res, 'Lỗi gửi email', 500);
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
            return sendError(res, 'Token không hợp lệ hoặc đã hết hạn', 400);
        }

        const salt = await bcrypt.genSalt(10);
        user.password_hash = await bcrypt.hash(password, salt);
        user.reset_password_token = null;
        user.reset_password_expires = null;

        await user.save();

        success(res, null, 'Mật khẩu đã được đặt lại thành công');
    } catch (err) {
        console.error(err.message);
        sendError(res, 'Server Error', 500);
    }
};
