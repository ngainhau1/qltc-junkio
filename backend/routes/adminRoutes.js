const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const ctrl = require('../controllers/adminController');

// All routes require admin role
router.get('/dashboard',              auth, role('admin'), ctrl.getDashboard);
router.get('/users',                  auth, role('admin'), ctrl.listUsers);
router.put('/users/:id/toggle-lock',  auth, role('admin'), ctrl.toggleLock);
router.put('/users/:id/role',         auth, role('admin'), ctrl.changeRole);

module.exports = router;
