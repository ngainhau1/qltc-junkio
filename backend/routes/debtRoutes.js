const express = require('express');
const router = express.Router();
const debtController = require('../controllers/debtController');
const auth = require('../middleware/authMiddleware');

// @route   GET /api/debts/pending
// @desc    Get all unresolved assigned debts for the logged-in user
// @access  Private
router.get('/pending', auth, debtController.getPendingDebts);

// @route   PUT /api/debts/:shareId/approve
// @desc    Accept to take on a debt share
// @access  Private
router.put('/:shareId/approve', auth, debtController.approveShare);

// @route   PUT /api/debts/:shareId/reject
// @desc    Reject a false debt share 
// @access  Private
router.put('/:shareId/reject', auth, debtController.rejectShare);

// @route   POST /api/debts/settle
// @desc    Settle debt with a friend through internal transfer
// @access  Private
router.post('/settle', auth, debtController.settleDebt);

module.exports = router;
