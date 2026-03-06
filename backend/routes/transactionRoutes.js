const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');

// POST /api/transactions/transfer
router.post('/transfer', transactionController.createTransfer);

module.exports = router;
