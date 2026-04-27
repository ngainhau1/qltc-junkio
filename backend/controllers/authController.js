const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { User, Family, FamilyMember } = require('../models');
const sendEmail = require('../services/emailService');
const { success, error: sendError } = require('../utils/responseHelper');

// GHI CHÚ HỌC TẬP - Phần xác thực của Thành Đạt:
// Controller này là trung tâm xử lý đăng ký, đăng nhập, làm mới phiên,
// đăng xuất và khôi phục mật khẩu. Khi trình bày, nên đi theo luồng:
// dữ liệu từ request -> kiểm tra -> thao tác cơ sở dữ liệu -> trả response chuẩn.

/**
 * Tạo access token sống ngắn trong 15 phút.
 * Token này được frontend gửi trong header Authorization để gọi các API cần đăng nhập.
 */
const generateAccessToken = (user) => {
    return jwt.sign(
        { user: { id: user.id, role: user.role } },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '15m' }
    );
};

/**
 * Tạo refresh token sống dài hơn để xin lại access token mới.
 * Refresh token được đặt trong cookie httpOnly nên JavaScript phía trình duyệt không đọc được.
 */
const generateRefreshToken = (user) => {
    return jwt.sign(
        { user: { id: user.id, role: user.role } },
        process.env.JWT_REFRESH_SECRET || 'refresh_secret_b6d9677116aa4',
        { expiresIn: '7d' }
    );
};

/**
 * Gắn refresh token vào cookie bảo mật.
 * httpOnly giúp giảm rủi ro bị script phía client đọc token; sameSite strict giảm rủi ro request chéo trang.
 */
const setRefreshTokenCookie = (res, token) => {
    res.cookie('refresh_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
    });
};

/**
 * Chỉ trả các thông tin an toàn cho frontend.
 * Không đưa password_hash hoặc token đặt lại mật khẩu vào response.
 */
const buildAuthUser = (user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar || null
});

exports.register = async (req, res) => {
    const { name, email, password } = req.body;

    // Lớp kiểm tra trực tiếp trong controller giúp bảo vệ thêm ngoài authValidator.
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

        // Chỉ lưu password_hash, không lưu mật khẩu gốc.
        user = await User.create({
            name,
            email,
            password_hash,
            role: 'member'
        });

        // Mỗi tài khoản mới có sẵn một Family mặc định để các tính năng ví/giao dịch gia đình hoạt động ngay.
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

        // Response trả access token cho frontend, còn refresh token nằm trong cookie.
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
            // Dùng một mã lỗi chung để không tiết lộ email nào đang tồn tại.
            return sendError(res, 'INVALID_CREDENTIALS', 400);
        }

        if (user.is_locked) {
            return sendError(res, 'ACCOUNT_LOCKED', 403);
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            // Không so sánh mật khẩu bằng chuỗi thường vì DB chỉ lưu password_hash.
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
        // verify vừa kiểm tra chữ ký, vừa kiểm tra thời hạn của refresh token.
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

        // Chỉ cấp lại access token, không bắt người dùng đăng nhập lại nếu refresh token còn hợp lệ.
        const newAccessToken = generateAccessToken(user);
        success(res, { token: newAccessToken, user: buildAuthUser(user) }, 'REFRESH_SUCCESS');
    } catch (err) {
        console.error('Refresh token error:', err.message);
        sendError(res, 'REFRESH_TOKEN_INVALID', 403);
    }
};

exports.logout = async (req, res) => {
    // Xóa cookie refresh_token để trình duyệt không thể xin access token mới sau khi đăng xuất.
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

        // DB chỉ lưu bản hash của resetToken; token gốc chỉ xuất hiện trong email gửi cho người dùng.
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
        // Hash lại token trong URL để so với bản hash đã lưu trong DB.
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
        // Xóa token sau khi dùng để đường dẫn đặt lại mật khẩu không thể dùng lần hai.
        user.reset_password_token = null;
        user.reset_password_expires = null;

        await user.save();

        success(res, null, 'RESET_PASSWORD_SUCCESS');
    } catch (err) {
        console.error(err.message);
        sendError(res, 'RESET_PASSWORD_FAILED', 500);
    }
};
