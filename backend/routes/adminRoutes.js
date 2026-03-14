const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const ctrl = require('../controllers/adminController');

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
 *     summary: Số liệu phân tích mở rộng
 *     tags: [Admin]
 *     security: [ { bearerAuth: [] } ]
 */
router.get('/analytics',              auth, role('admin'), ctrl.getAnalytics);
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
router.delete('/users/:id',           auth, role('admin'), audit('USER_DELETED', 'USER'), ctrl.deleteUser);
router.put('/users/:id/toggle-lock',  auth, role('admin'), audit('USER_LOCKED_UNLOCKED', 'USER'), ctrl.toggleLock);
router.put('/users/:id/role',         auth, role('admin'), audit('ROLE_CHANGED', 'USER'), ctrl.changeRole);
/**
 * @swagger
 * /api/admin/logs:
 *   get:
 *     summary: Xem audit logs
 *     tags: [Admin]
 *     security: [ { bearerAuth: [] } ]
 */
router.get('/logs',                   auth, role('admin'), ctrl.getLogs);
/**
 * @swagger
 * /api/admin/financial-overview:
 *   get:
 *     summary: Tổng quan tài chính hệ thống
 *     tags: [Admin]
 *     security: [ { bearerAuth: [] } ]
 */
router.get('/financial-overview',     auth, role('admin'), ctrl.getFinancialOverview);

module.exports = router;
