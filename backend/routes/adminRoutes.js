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
 *   description: Quan tri he thong, chi danh cho role admin
 */

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Lay tong quan he thong cap platform
 *     tags: [Admin]
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       200:
 *         description: Du lieu dashboard admin thanh cong
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
 *                     totalUsers:
 *                       type: integer
 *                     totalTransactions:
 *                       type: integer
 *                     totalFamilies:
 *                       type: integer
 *                     recentUsers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *                           role:
 *                             type: string
 *                             enum: [member, staff, admin]
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 */
router.get('/dashboard', auth, role('admin'), ctrl.getDashboard);

/**
 * @swagger
 * /api/admin/analytics:
 *   get:
 *     summary: Lay analytics toan he thong
 *     tags: [Admin]
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       200:
 *         description: Analytics admin thanh cong
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
 *                     stats:
 *                       type: object
 *                       properties:
 *                         totalWallets:
 *                           type: integer
 *                         totalGoals:
 *                           type: integer
 *                         totalBudgets:
 *                           type: integer
 *                     userGrowth:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           month:
 *                             type: string
 *                           count:
 *                             type: integer
 *                     topCategories:
 *                       type: array
 *                       items:
 *                         type: object
 *                     weeklyActivity:
 *                       type: array
 *                       items:
 *                         type: object
 */
router.get('/analytics', auth, role('admin'), ctrl.getAnalytics);

/**
 * @swagger
 * /api/admin/financial-overview:
 *   get:
 *     summary: Lay tong quan tai chinh toan he thong
 *     tags: [Admin]
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       200:
 *         description: Tong quan tai chinh thanh cong
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
 *                     systemBalance:
 *                       type: number
 *                     revenueTrends:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           month:
 *                             type: string
 *                           income:
 *                             type: number
 *                           expense:
 *                             type: number
 *                     topSpenders:
 *                       type: array
 *                       items:
 *                         type: object
 *                     budgetCompliance:
 *                       type: number
 */
router.get('/financial-overview', auth, role('admin'), ctrl.getFinancialOverview);

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Lay danh sach user toan he thong
 *     tags: [Admin]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [all, member, staff, admin]
 *           default: all
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, active, locked]
 *           default: all
 *     responses:
 *       200:
 *         description: Danh sach user thanh cong
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
 *                     users:
 *                       type: array
 *                       items:
 *                         type: object
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 */
router.get('/users', auth, role('admin'), ctrl.listUsers);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   get:
 *     summary: Lay chi tiet mot user
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
 *       200:
 *         description: Chi tiet user thanh cong
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
 *                     role:
 *                       type: string
 *                     is_locked:
 *                       type: boolean
 *                     wallets:
 *                       type: array
 *                       items:
 *                         type: object
 *                     Families:
 *                       type: array
 *                       items:
 *                         type: object
 *                     transactionCount:
 *                       type: integer
 *       404:
 *         description: User khong ton tai
 */
router.get('/users/:id', auth, role('admin'), ctrl.getUserDetail);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Xoa user
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
 *       200:
 *         description: Xoa user thanh cong
 *       400:
 *         description: Khong duoc xoa chinh minh
 *       404:
 *         description: User khong ton tai
 */
router.delete('/users/:id', auth, role('admin'), validateUserParam, audit('USER_DELETED', 'USER'), ctrl.deleteUser);

/**
 * @swagger
 * /api/admin/users/{id}/toggle-lock:
 *   put:
 *     summary: Khoa hoac mo khoa tai khoan user
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
 *       200:
 *         description: Thay doi trang thai khoa thanh cong
 *       400:
 *         description: Khong duoc khoa chinh minh
 */
router.put('/users/:id/toggle-lock', auth, role('admin'), validateUserParam, audit('USER_LOCKED_UNLOCKED', 'USER'), ctrl.toggleLock);

/**
 * @swagger
 * /api/admin/users/{id}/role:
 *   put:
 *     summary: Thay doi vai tro user
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
 *                 example: staff
 *     responses:
 *       200:
 *         description: Doi role thanh cong
 *       400:
 *         description: Role khong hop le hoac dang doi role cua chinh minh
 */
router.put('/users/:id/role', auth, role('admin'), validateChangeRole, audit('ROLE_CHANGED', 'USER'), ctrl.changeRole);

/**
 * @swagger
 * /api/admin/logs:
 *   get:
 *     summary: Lay audit logs he thong
 *     tags: [Admin]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           default: ALL
 *     responses:
 *       200:
 *         description: Danh sach audit logs thanh cong
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
 *                     logs:
 *                       type: array
 *                       items:
 *                         type: object
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 */
router.get('/logs', auth, role('admin'), ctrl.getLogs);

module.exports = router;
