const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const ctrl = require('../controllers/adminController');

const audit = require('../middleware/auditMiddleware');

// All routes require admin role
router.get('/dashboard',              auth, role('admin'), ctrl.getDashboard);
router.get('/analytics',              auth, role('admin'), ctrl.getAnalytics);
router.get('/users',                  auth, role('admin'), ctrl.listUsers);
router.get('/users/:id',              auth, role('admin'), ctrl.getUserDetail);
router.delete('/users/:id',           auth, role('admin'), audit('USER_DELETED', 'USER'), ctrl.deleteUser);
router.put('/users/:id/toggle-lock',  auth, role('admin'), audit('USER_LOCKED_UNLOCKED', 'USER'), ctrl.toggleLock);
router.put('/users/:id/role',         auth, role('admin'), audit('ROLE_CHANGED', 'USER'), ctrl.changeRole);
router.get('/logs',                   auth, role('admin'), ctrl.getLogs);
router.get('/financial-overview',     auth, role('admin'), ctrl.getFinancialOverview);

module.exports = router;
