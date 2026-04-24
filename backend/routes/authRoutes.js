const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const audit = require('../middleware/auditMiddleware');
const authValidator = require('../validators/authValidator');

// GHI CHÚ HỌC TẬP - Phần xác thực của Thành Đạt:
// File route này nối URL bên ngoài với controller xử lý thật.
// Thứ tự thường gặp: validator kiểm dữ liệu -> audit ghi log nếu cần -> controller xử lý nghiệp vụ.

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: |
 *     Xác thực người dùng và quản lý phiên đăng nhập.
 *     Nhóm API này bao gồm đăng ký, đăng nhập, làm mới token, đăng xuất
 *     và các chức năng khôi phục mật khẩu. Hầu hết các endpoint **không yêu cầu token**
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Đăng ký tài khoản mới
 *     description: |
 *       Tạo một tài khoản người dùng mới trên hệ thống Junkio.
 *       Sau khi đăng ký thành công, người dùng cần **đăng nhập** để nhận JWT token.
 *
 *       **Yêu cầu:**
 *       - Email phải là duy nhất trên hệ thống
 *       - Mật khẩu tối thiểu 6 ký tự
 *       - Tên hiển thị không được để trống
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Nguyễn Văn A
 *                 description: Tên hiển thị của người dùng
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@junkio.com
 *                 description: Email đăng nhập (phải là duy nhất)
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "123456"
 *                 description: Mật khẩu (tối thiểu 6 ký tự)
 *           example:
 *             name: Nguyễn Văn A
 *             email: user@junkio.com
 *             password: "123456"
 *     responses:
 *       201:
 *         description: Đăng ký thành công
 *         content:
 *           application/json:
 *             example:
 *               status: success
 *               message: Đăng ký thành công
 *       409:
 *         description: Email đã tồn tại trên hệ thống (EMAIL_EXISTS)
 *       422:
 *         description: Dữ liệu gửi lên không hợp lệ (thiếu field, sai format)
 */
// Đăng ký cần validate dữ liệu và ghi log USER_REGISTER khi tạo tài khoản thành công.
router.post('/register', authValidator.validateRegister, audit('USER_REGISTER', 'USER'), authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Đăng nhập và nhận JWT access token
 *     description: |
 *       Xác thực thông tin đăng nhập và trả về JWT access token.
 *
 *       **Quy trình sử dụng token:**
 *       1. Gọi API này với email + password
 *       2. Copy giá trị `token` từ response
 *       3. Click nút **Authorize** ở đầu trang Swagger UI
 *       4. Dán token vào ô Value và nhấn Authorize
 *       5. Tất cả các API có biểu tượng khóa sẽ tự động gửi kèm token
 *
 *       **Thông tin token:**
 *       - Access token hết hạn sau **15 phút**
 *       - Refresh token được lưu trong cookie HttpOnly, hết hạn sau **7 ngày**
 *       - Khi access token hết hạn, gọi `/api/auth/refresh-token` để lấy token mới
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: demo@junkio.com
 *                 description: Email đã đăng ký
 *               password:
 *                 type: string
 *                 format: password
 *                 example: demo123
 *                 description: Mật khẩu tài khoản
 *           example:
 *             email: demo@junkio.com
 *             password: demo123
 *     responses:
 *       200:
 *         description: Đăng nhập thành công, trả về token và thông tin user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Đăng nhập thành công
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       description: JWT access token (hết hạn sau 15 phút)
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         email:
 *                           type: string
 *                         role:
 *                           type: string
 *                           enum: [member, staff, admin]
 *             example:
 *               status: success
 *               message: Đăng nhập thành công
 *               data:
 *                 token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImIyZGYw..."
 *                 user:
 *                   id: "b2df0d5d-1234-4abc-9def-bbbd02910001"
 *                   name: "Demo User"
 *                   email: "demo@junkio.com"
 *                   role: member
 *       400:
 *         description: Email hoặc mật khẩu không đúng (INVALID_CREDENTIALS)
 *       423:
 *         description: Tài khoản đã bị khóa bởi admin (ACCOUNT_LOCKED)
 */
// Đăng nhập cần validate email/password và ghi log USER_LOGIN khi đăng nhập thành công.
router.post('/login', authValidator.validateLogin, audit('USER_LOGIN', 'USER'), authController.login);

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     summary: Làm mới access token từ refresh token cookie
 *     description: |
 *       Khi access token hết hạn (sau 15 phút), Frontend tự động gọi API này
 *       để lấy token mới mà không cần người dùng đăng nhập lại.
 *
 *       **Cách hoạt động:**
 *       - Server đọc `refresh_token` từ cookie HttpOnly (tự động gửi kèm bởi trình duyệt)
 *       - Nếu hợp lệ, trả về access token mới
 *       - Nếu refresh token cũng hết hạn (sau 7 ngày), yêu cầu đăng nhập lại
 *
 *       **Lưu ý:** API này không cần gửi body, chỉ cần cookie hợp lệ.
 *     tags: [Auth]
 *     security: []
 *     responses:
 *       200:
 *         description: Làm mới token thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         email:
 *                           type: string
 *                         role:
 *                           type: string
 *                           enum: [member, staff, admin]
 *             example:
 *               status: success
 *               message: Làm mới token thành công
 *               data:
 *                 token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.newToken..."
 *                 user:
 *                   id: "b2df0d5d-1234-4abc-9def-bbbd02910001"
 *                   name: "Demo User"
 *                   email: "demo@junkio.com"
 *                   role: member
 *       401:
 *         description: Không có refresh token trong cookie (REFRESH_TOKEN_MISSING)
 *       403:
 *         description: Refresh token hết hạn hoặc không hợp lệ (REFRESH_TOKEN_EXPIRED)
 */
// Refresh token đọc cookie httpOnly, không cần body và không cần access token còn hạn.
router.post('/refresh-token', authController.refreshToken);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Đăng xuất và xóa refresh token
 *     description: |
 *       Xóa refresh token cookie khỏi trình duyệt.
 *       Sau khi gọi API này, access token hiện tại vẫn hoạt động cho đến khi hết hạn,
 *       nhưng không thể làm mới token nữa.
 *
 *       **Lưu ý:** Frontend nên xóa access token khỏi bộ nhớ local sau khi gọi API này.
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Đăng xuất thành công
 *         content:
 *           application/json:
 *             example:
 *               status: success
 *               message: Đăng xuất thành công
 */
// Logout xóa refresh token ở cookie; frontend cũng cần xóa access token trong localStorage.
router.post('/logout', authController.logout);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Gửi email khôi phục mật khẩu
 *     description: |
 *       Gửi email chứa link đặt lại mật khẩu đến địa chỉ email đã đăng ký.
 *       Link khôi phục có hiệu lực trong **10 phút**.
 *
 *       **Quy trình:**
 *       1. Người dùng nhập email
 *       2. Server gửi email chứa token khôi phục
 *       3. Người dùng click link trong email
 *       4. Gọi API `/api/auth/reset-password/{token}` với mật khẩu mới
 *
 *       **Lưu ý:** API luôn trả về thành công để tránh lộ thông tin email nào tồn tại.
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@junkio.com
 *                 description: Email đã đăng ký trên hệ thống
 *           example:
 *             email: user@junkio.com
 *     responses:
 *       200:
 *         description: Email khôi phục đã được gửi
 *         content:
 *           application/json:
 *             example:
 *               status: success
 *               message: Email khôi phục đã được gửi
 *       404:
 *         description: Email không tồn tại trên hệ thống (EMAIL_NOT_FOUND)
 */
// Quên mật khẩu chỉ cần email hợp lệ để gửi đường dẫn đặt lại mật khẩu.
router.post('/forgot-password', authValidator.validateForgotPassword, authController.forgotPassword);

/**
 * @swagger
 * /api/auth/reset-password/{token}:
 *   post:
 *     summary: Đặt lại mật khẩu bằng token khôi phục
 *     description: |
 *       Thiết lập mật khẩu mới cho tài khoản sử dụng token nhận được qua email.
 *
 *       **Yêu cầu:**
 *       - Token phải còn hiệu lực (trong vòng 10 phút kể từ khi gửi)
 *       - Mật khẩu mới tối thiểu 6 ký tự
 *       - Mỗi token chỉ sử dụng được **một lần**
 *
 *       Sau khi đặt lại thành công, người dùng cần đăng nhập lại với mật khẩu mới.
 *     tags: [Auth]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Token khôi phục nhận được qua email (chuỗi hex dài)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password]
 *             properties:
 *               password:
 *                 type: string
 *                 format: password
 *                 example: newPassword123
 *                 description: Mật khẩu mới (tối thiểu 6 ký tự)
 *           example:
 *             password: newPassword123
 *     responses:
 *       200:
 *         description: Mật khẩu đã được đặt lại thành công
 *         content:
 *           application/json:
 *             example:
 *               status: success
 *               message: Mật khẩu đã được đặt lại thành công
 *       400:
 *         description: Token không hợp lệ hoặc đã hết hạn (INVALID_RESET_TOKEN)
 */
// Đặt lại mật khẩu cần token trên URL và mật khẩu mới trong body.
router.post('/reset-password/:token', authValidator.validateResetPassword, authController.resetPassword);

module.exports = router;
