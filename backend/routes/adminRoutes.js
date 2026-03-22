const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const ctrl = require('../controllers/adminController');
const { validateUserParam, validateChangeRole } = require('../validators/adminValidator');

const audit = require('../middleware/auditMiddleware');

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Quản trị hệ thống (yêu cầu role admin)
 */

// All routes require admin role
/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Thống kê tổng quan hệ thống
 *     tags: [Admin]
 *     security: [ { bearerAuth: [] } ]
 */
router.get('/dashboard',              auth, role('admin'), ctrl.getDashboard);
/**
 * @swagger
 * /api/admin/analytics:
 *   get:
 *     summary: Thá»‘ng kÃª chi tiáº¿t há»‡ thá»‘ng
 *     tags: [Admin]
 *     security: [ { bearerAuth: [] } ]
 */
router.get('/analytics',              auth, role('admin'), ctrl.getAnalytics);
/**
 * @swagger
 * /api/admin/financial-overview:
 *   get:
 *     summary: Tá»•ng quan tÃ i chÃ­nh há»‡ thá»‘ng
 *     tags: [Admin]
 *     security: [ { bearerAuth: [] } ]
 */
router.get('/financial-overview',     auth, role('admin'), ctrl.getFinancialOverview);

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Danh sách người dùng
 *     tags: [Admin]
 *     security: [ { bearerAuth: [] } ]
 */
router.get('/users',                  auth, role('admin'), ctrl.listUsers);
/**
 * @swagger
 * /api/admin/users/{id}:
 *   get:
 *     summary: Chi tiết người dùng
 *     tags: [Admin]
 *     security: [ { bearerAuth: [] } ]
 */
router.get('/users/:id',              auth, role('admin'), ctrl.getUserDetail);
/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Xóa người dùng
 *     tags: [Admin]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200: { description: Xóa thành công }
 *       404: { description: Không tìm thấy user }
 */
router.delete('/users/:id',           auth, role('admin'), validateUserParam, audit('USER_DELETED', 'USER'), ctrl.deleteUser);
/**
 * @swagger
 * /api/admin/users/{id}/toggle-lock:
 *   put:
 *     summary: Khóa / mở khóa tài khoản người dùng
 *     tags: [Admin]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200: { description: Thay đổi trạng thái khóa thành công }
 */
router.put('/users/:id/toggle-lock',  auth, role('admin'), validateUserParam, audit('USER_LOCKED_UNLOCKED', 'USER'), ctrl.toggleLock);
/**
 * @swagger
 * /api/admin/users/{id}/role:
 *   put:
 *     summary: Thay đổi vai trò người dùng (member/staff/admin)
 *     tags: [Admin]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [member, staff, admin]
 *     responses:
 *       200: { description: Đổi role thành công }
 */
router.put('/users/:id/role',         auth, role('admin'), validateChangeRole, audit('ROLE_CHANGED', 'USER'), ctrl.changeRole);
/**
 * @swagger
 * /api/admin/logs:
 *   get:
 *     summary: Xem audit logs
 *     tags: [Admin]
 *     security: [ { bearerAuth: [] } ]
 */
router.get('/logs',                   auth, role('admin'), ctrl.getLogs);


module.exports = router;
