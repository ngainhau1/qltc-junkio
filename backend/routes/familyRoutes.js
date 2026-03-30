const express = require('express');
const router = express.Router();
const familyController = require('../controllers/familyController');
const authMiddleware = require('../middleware/authMiddleware');
const { validateCreateFamily, validateAddMember, validateFamilyParam, validateRemoveMember } = require('../validators/familyValidator');

router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Families
 *   description: |
 *     Quản lý nhóm gia đình và thành viên.
 *     Gia đình cho phép nhiều người dùng chia sẻ ví chung, theo dõi chi tiêu chung,
 *     và phân chia nợ trong nhóm.
 */

/**
 * @swagger
 * /api/families:
 *   get:
 *     summary: Lấy danh sách gia đình mà tôi tham gia
 *     description: |
 *       Trả về tất cả các nhóm gia đình mà người dùng hiện tại là thành viên
 *       (bao gồm cả gia đình do mình tạo và gia đình được mời vào).
 *     tags: [Families]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách gia đình thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   created_by:
 *                     type: string
 *             example:
 *               - id: "f1a2b3c4-..."
 *                 name: "Gia đình Nguyễn"
 *                 created_by: "b2df0d5d-..."
 *               - id: "f2b3c4d5-..."
 *                 name: "Nhóm bạn thân"
 *                 created_by: "c3ef1e6e-..."
 */
router.get('/', familyController.getUserFamilies);

/**
 * @swagger
 * /api/families:
 *   post:
 *     summary: Tạo nhóm gia đình mới
 *     description: |
 *       Tạo một nhóm gia đình mới. Người tạo tự động trở thành **ADMIN** của gia đình.
 *       Sau khi tạo, có thể mời thêm thành viên bằng email qua API thêm thành viên.
 *     tags: [Families]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Gia đình Nguyễn
 *                 description: Tên nhóm gia đình
 *           example:
 *             name: Gia đình Nguyễn
 *     responses:
 *       201:
 *         description: Tạo gia đình thành công
 *         content:
 *           application/json:
 *             example:
 *               status: success
 *               message: Tạo gia đình thành công
 *               data:
 *                 id: "f-new-family-id"
 *                 name: "Gia đình Nguyễn"
 *                 created_by: "b2df0d5d-..."
 *       400:
 *         description: Dữ liệu không hợp lệ (thiếu tên)
 */
router.post('/', validateCreateFamily, familyController.createFamily);

/**
 * @swagger
 * /api/families/{id}:
 *   get:
 *     summary: Xem chi tiết gia đình và danh sách thành viên
 *     description: |
 *       Trả về thông tin chi tiết của một gia đình, bao gồm:
 *       - Tên gia đình, người tạo
 *       - Danh sách tất cả thành viên (tên, email, vai trò trong gia đình)
 *
 *       Chỉ thành viên của gia đình mới có quyền xem.
 *     tags: [Families]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID của gia đình
 *     responses:
 *       200:
 *         description: Chi tiết gia đình thành công
 *         content:
 *           application/json:
 *             example:
 *               status: success
 *               data:
 *                 id: "f1a2b3c4-..."
 *                 name: "Gia đình Nguyễn"
 *                 created_by: "b2df0d5d-..."
 *                 members:
 *                   - id: "b2df0d5d-..."
 *                     name: "Nguyễn Văn A"
 *                     email: "nguyenvana@junkio.com"
 *                     role: ADMIN
 *                   - id: "c3ef1e6e-..."
 *                     name: "Nguyễn Thị B"
 *                     email: "nguyenthib@junkio.com"
 *                     role: MEMBER
 *       404:
 *         description: Gia đình không tồn tại (FAMILY_NOT_FOUND)
 */
router.get('/:id', validateFamilyParam, familyController.getFamilyDetails);

/**
 * @swagger
 * /api/families/{id}/members:
 *   post:
 *     summary: Thêm thành viên vào gia đình bằng email
 *     description: |
 *       Mời một người dùng khác vào gia đình bằng địa chỉ email.
 *
 *       **Yêu cầu:**
 *       - Email phải thuộc về một tài khoản Junkio đã đăng ký
 *       - Người được mời chưa là thành viên của gia đình này
 *       - Người mời phải là ADMIN của gia đình
 *
 *       **Vai trò trong gia đình:**
 *       - `ADMIN`: Có quyền quản lý thành viên, xóa gia đình
 *       - `MEMBER`: Thành viên thường, có quyền xem/tạo giao dịch chung
 *     tags: [Families]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID của gia đình
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
 *                 example: member@junkio.com
 *                 description: Email của người muốn mời
 *               role:
 *                 type: string
 *                 enum: [ADMIN, MEMBER]
 *                 default: MEMBER
 *                 description: Vai trò trong gia đình
 *           example:
 *             email: member@junkio.com
 *             role: MEMBER
 *     responses:
 *       200:
 *         description: Thêm thành viên thành công
 *         content:
 *           application/json:
 *             example:
 *               status: success
 *               message: Thêm thành viên thành công
 *       404:
 *         description: Gia đình hoặc user không tồn tại
 *       409:
 *         description: User đã là thành viên của gia đình (MEMBER_EXISTS)
 */
router.post('/:id/members', validateAddMember, familyController.addMember);

/**
 * @swagger
 * /api/families/{id}/members/{userIdToRemove}:
 *   delete:
 *     summary: Xóa thành viên khỏi gia đình
 *     description: |
 *       Xóa một thành viên ra khỏi nhóm gia đình.
 *
 *       **Quy tắc:**
 *       - Chỉ ADMIN gia đình mới có quyền xóa thành viên khác
 *       - Thành viên có thể tự rời gia đình bằng cách gửi `userIdToRemove` = chính mình
 *       - Không thể xóa người tạo (owner) ra khỏi gia đình
 *     tags: [Families]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID của gia đình
 *       - in: path
 *         name: userIdToRemove
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID user cần xóa khỏi gia đình
 *     responses:
 *       200:
 *         description: Xóa thành viên thành công
 *         content:
 *           application/json:
 *             example:
 *               status: success
 *               message: Xóa thành viên thành công
 *       403:
 *         description: Chỉ admin gia đình mới có quyền xóa
 *       404:
 *         description: Thành viên không tồn tại trong gia đình
 */
router.delete('/:id/members/:userIdToRemove', validateRemoveMember, familyController.removeMember);

/**
 * @swagger
 * /api/families/{id}:
 *   delete:
 *     summary: Xóa gia đình vĩnh viễn
 *     description: |
 *       Xóa hoàn toàn nhóm gia đình và tất cả dữ liệu liên quan.
 *       Hành động này **không thể hoàn tác**.
 *
 *       **Chỉ người tạo (owner)** gia đình mới có quyền xóa.
 *       Ví gia đình, giao dịch chung, ngân sách gia đình sẽ bị xóa theo.
 *     tags: [Families]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID của gia đình cần xóa
 *     responses:
 *       200:
 *         description: Xóa gia đình thành công
 *         content:
 *           application/json:
 *             example:
 *               status: success
 *               message: Xóa gia đình thành công
 *       403:
 *         description: Chỉ người tạo mới có quyền xóa (NOT_FAMILY_OWNER)
 *       404:
 *         description: Gia đình không tồn tại (FAMILY_NOT_FOUND)
 */
router.delete('/:id', validateFamilyParam, familyController.deleteFamily);

module.exports = router;
