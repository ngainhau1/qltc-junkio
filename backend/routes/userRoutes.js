const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const { uploadAvatar } = require('../middleware/uploadMiddleware');
const { validateUpdateProfile, validateChangePassword } = require('../validators/userValidator');

router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: |
 *     Quản lý hồ sơ cá nhân của người dùng đang đăng nhập.
 *     Tất cả endpoint trong nhóm này yêu cầu Bearer Token.
 *     Đây là nhóm endpoint chính (canonical) cho profile, avatar, đổi mật khẩu.
 */

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Lấy thông tin hồ sơ cá nhân
 *     description: |
 *       Trả về đầy đủ thông tin profile của người dùng đang đăng nhập,
 *       bao gồm tên, email, role, và đường dẫn avatar.
 *
 *       Đây là **canonical endpoint** (endpoint chính).
 *       Alias tương thích: `/api/auth/me`
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy hồ sơ thành công
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
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     avatar:
 *                       type: string
 *                       nullable: true
 *                     role:
 *                       type: string
 *                       enum: [member, staff, admin]
 *             example:
 *               status: success
 *               message: Lấy profile thành công
 *               data:
 *                 id: "b2df0d5d-1234-4abc-9def-bbbd02910001"
 *                 name: "Nguyễn Văn A"
 *                 email: "nguyenvana@junkio.com"
 *                 avatar: "/uploads/avatars/b2df0d5d-avatar.jpg"
 *                 role: member
 *       401:
 *         description: Chưa đăng nhập hoặc token hết hạn
 *       404:
 *         description: Không tìm thấy user (USER_NOT_FOUND)
 */
router.get('/me', userController.getProfile);

/**
 * @swagger
 * /api/users/me/avatar:
 *   post:
 *     summary: Cập nhật ảnh đại diện (avatar)
 *     description: |
 *       Upload hoặc thay thế ảnh đại diện của người dùng hiện tại.
 *       Đây là **canonical endpoint** (endpoint chính).
 *       Alias tương thích: `/api/auth/avatar`
 *
 *       **Yêu cầu file:**
 *       - Định dạng hỗ trợ: JPEG, JPG, PNG, GIF
 *       - Dung lượng tối đa: **5MB**
 *       - Tên field trong form-data: `avatar`
 *
 *       Ảnh cũ sẽ tự động bị xóa khi upload ảnh mới.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [avatar]
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: File ảnh (JPEG/PNG/GIF, tối đa 5MB)
 *     responses:
 *       200:
 *         description: Cập nhật avatar thành công
 *         content:
 *           application/json:
 *             example:
 *               status: success
 *               message: Cập nhật avatar thành công
 *               data:
 *                 avatar_url: "/uploads/avatars/b2df0d5d-avatar-1711792000.jpg"
 *       400:
 *         description: File không hợp lệ (sai định dạng hoặc vượt quá 5MB)
 */
router.post('/me/avatar', uploadAvatar.single('avatar'), userController.updateAvatar);

/**
 * @swagger
 * /api/users/me:
 *   put:
 *     summary: Cập nhật hồ sơ cá nhân
 *     description: |
 *       Cho phép người dùng thay đổi tên hiển thị và các thông tin cá nhân khác.
 *       Chỉ cần gửi các field muốn thay đổi, không bắt buộc gửi tất cả.
 *
 *       **Lưu ý:** Không thể thay đổi email hoặc role qua API này.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Nguyễn Văn B
 *                 description: Tên hiển thị mới
 *           example:
 *             name: Nguyễn Văn B
 *     responses:
 *       200:
 *         description: Cập nhật hồ sơ thành công
 *         content:
 *           application/json:
 *             example:
 *               status: success
 *               message: Cập nhật profile thành công
 *               data:
 *                 id: "b2df0d5d-1234-4abc-9def-bbbd02910001"
 *                 name: "Nguyễn Văn B"
 *                 email: "nguyenvana@junkio.com"
 *       401:
 *         description: Chưa đăng nhập
 */
router.put('/me', validateUpdateProfile, userController.updateProfile);

/**
 * @swagger
 * /api/users/me/password:
 *   put:
 *     summary: Đổi mật khẩu tài khoản
 *     description: |
 *       Cho phép người dùng thay đổi mật khẩu hiện tại.
 *       Yêu cầu nhập đúng mật khẩu hiện tại (`currentPassword`) để xác minh danh tính.
 *
 *       **Yêu cầu mật khẩu mới:**
 *       - Tối thiểu 6 ký tự
 *       - Phải khác mật khẩu hiện tại
 *
 *       Sau khi đổi thành công, token hiện tại vẫn hoạt động bình thường.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *                 example: oldPassword123
 *                 description: Mật khẩu hiện tại (để xác minh)
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: newPassword456
 *                 minLength: 6
 *                 description: Mật khẩu mới (tối thiểu 6 ký tự)
 *           example:
 *             currentPassword: oldPassword123
 *             newPassword: newPassword456
 *     responses:
 *       200:
 *         description: Đổi mật khẩu thành công
 *         content:
 *           application/json:
 *             example:
 *               status: success
 *               message: Đổi mật khẩu thành công
 *       400:
 *         description: Mật khẩu hiện tại sai hoặc mật khẩu mới quá ngắn (WRONG_PASSWORD)
 */
router.put('/me/password', validateChangePassword, userController.changePassword);

/**
 * @swagger
 * /api/users/me:
 *   delete:
 *     summary: Xóa tài khoản vĩnh viễn
 *     description: |
 *       Xóa hoàn toàn tài khoản và tất cả dữ liệu liên quan (ví, giao dịch, mục tiêu...).
 *       Hành động này **không thể hoàn tác**.
 *
 *       **Bảo mật:** Yêu cầu nhập đúng mật khẩu hiện tại để xác nhận.
 *       Đây là biện pháp chống xóa nhầm khi token bị đánh cắp.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
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
 *                 description: Mật khẩu hiện tại (để xác nhận xóa)
 *           example:
 *             password: myCurrentPassword123
 *     responses:
 *       200:
 *         description: Xóa tài khoản thành công
 *         content:
 *           application/json:
 *             example:
 *               status: success
 *               message: Tài khoản đã được xóa vĩnh viễn
 *       400:
 *         description: Mật khẩu không đúng (WRONG_PASSWORD)
 */
router.delete('/me', userController.deleteAccount);

module.exports = router;
