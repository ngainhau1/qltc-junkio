const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');

const authMiddleware = require('../middleware/authMiddleware');

// POST /api/transactions/transfer
router.post('/transfer', authMiddleware, transactionController.createTransfer);

// POST /api/transactions/import
router.post('/import', authMiddleware, transactionController.importTransactions);

module.exports = router;
