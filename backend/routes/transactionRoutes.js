const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const authMiddleware = require('../middleware/authMiddleware');

// Lấy danh sách
router.get('/', authMiddleware, transactionController.getTransactions);

// Tạo giao dịch (Income / Expense)
router.post('/', authMiddleware, transactionController.createTransaction);

// Chuyển khoản (Transfer)
router.post('/transfer', authMiddleware, transactionController.createTransfer);

// Nhập dữ liệu (Import CSV)
router.post('/import', authMiddleware, transactionController.importTransactions);

// Xuất dữ liệu (Export CSV/PDF)
router.get('/export', authMiddleware, transactionController.exportTransactions);

// Xóa giao dịch
router.delete('/:id', authMiddleware, transactionController.deleteTransaction);

module.exports = router;
