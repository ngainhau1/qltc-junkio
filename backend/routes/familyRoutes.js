const express = require('express');
const router = express.Router();
const familyController = require('../controllers/familyController');
const authMiddleware = require('../middleware/authMiddleware');

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
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       200: { description: Danh sách gia đình }
 */
router.get('/', familyController.getUserFamilies);

/**
 * @swagger
 * /api/families:
 *   post:
 *     summary: Tạo gia đình mới
 *     tags: [Families]
 *     security: [ { bearerAuth: [] } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *     responses:
 *       201: { description: Tạo thành công }
 */
router.post('/', familyController.createFamily);

/**
 * @swagger
 * /api/families/{id}:
 *   get:
 *     summary: Xem chi tiết gia đình
 *     tags: [Families]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200: { description: Chi tiết gia đình }
 */
router.get('/:id', familyController.getFamilyDetails);

/**
 * @swagger
 * /api/families/{id}/members:
 *   post:
 *     summary: Thêm thành viên vào gia đình
 *     tags: [Families]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200: { description: Thêm thành viên thành công }
 */
router.post('/:id/members', familyController.addMember);

/**
 * @swagger
 * /api/families/{id}/members/{userIdToRemove}:
 *   delete:
 *     summary: Xóa thành viên khỏi gia đình
 *     tags: [Families]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *       - in: path
 *         name: userIdToRemove
 *         required: true
 *     responses:
 *       200: { description: Xóa thành viên thành công }
 */
router.delete('/:id/members/:userIdToRemove', familyController.removeMember);

/**
 * @swagger
 * /api/families/{id}:
 *   delete:
 *     summary: Xóa gia đình
 *     tags: [Families]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200: { description: Xóa thành công }
 */
router.delete('/:id', familyController.deleteFamily);

module.exports = router;
