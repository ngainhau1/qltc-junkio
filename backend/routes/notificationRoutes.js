const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const auth = require('../middleware/authMiddleware');

// @route   GET api/notifications
// @desc    Get user notifications
// @access  Private
router.get('/', auth, notificationController.getNotifications);

// @route   PUT api/notifications/read-all
// @desc    Mark all user notifications as read
// @access  Private
router.put('/read-all', auth, notificationController.markAllAsRead);

// @route   PUT api/notifications/:id/read
// @desc    Mark a single user notification as read
// @access  Private
router.put('/:id/read', auth, notificationController.markAsRead);

// @route   POST api/notifications/broadcast
// @desc    Admin broadcasts a message to all users
// @access  Private (Admin only logic inside)
router.post('/broadcast', auth, notificationController.adminBroadcast);

module.exports = router;
