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
 *   description: Quản lý gia đình và thành viên
 */

/**
 * @swagger
 * /api/families:
 *   get:
 *     summary: Lấy danh sách gia đình của tôi
 *     tags: [Families]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách gia đình
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
 */
router.get('/', familyController.getUserFamilies);

/**
 * @swagger
 * /api/families:
 *   post:
 *     summary: Tạo gia đình mới
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
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 */
router.post('/', validateCreateFamily, familyController.createFamily);

/**
 * @swagger
 * /api/families/{id}:
 *   get:
 *     summary: Xem chi tiết gia đình (bao gồm danh sách thành viên)
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
 *     responses:
 *       200:
 *         description: Chi tiết gia đình
 *       404:
 *         description: Gia đình không tồn tại
 */
router.get('/:id', validateFamilyParam, familyController.getFamilyDetails);

/**
 * @swagger
 * /api/families/{id}/members:
 *   post:
 *     summary: Thêm thành viên vào gia đình (bằng email)
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
 *         description: ID gia đình
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
 *               role:
 *                 type: string
 *                 enum: [ADMIN, MEMBER]
 *                 default: MEMBER
 *     responses:
 *       200:
 *         description: Thêm thành viên thành công
 *       404:
 *         description: Gia đình hoặc user không tồn tại
 *       409:
 *         description: User đã là thành viên
 */
router.post('/:id/members', validateAddMember, familyController.addMember);

/**
 * @swagger
 * /api/families/{id}/members/{userIdToRemove}:
 *   delete:
 *     summary: Xóa thành viên khỏi gia đình
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
 *         description: ID gia đình
 *       - in: path
 *         name: userIdToRemove
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID user cần xóa
 *     responses:
 *       200:
 *         description: Xóa thành viên thành công
 *       403:
 *         description: Chỉ admin gia đình mới có quyền
 *       404:
 *         description: Thành viên không tồn tại
 */
router.delete('/:id/members/:userIdToRemove', validateRemoveMember, familyController.removeMember);

/**
 * @swagger
 * /api/families/{id}:
 *   delete:
 *     summary: Xóa gia đình
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
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       403:
 *         description: Chỉ người tạo mới có quyền xóa
 *       404:
 *         description: Gia đình không tồn tại
 */
router.delete('/:id', validateFamilyParam, familyController.deleteFamily);

module.exports = router;
