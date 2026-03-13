const express = require('express');
const router = express.Router();
const recurringController = require('../controllers/recurringController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', recurringController.getPatterns);
router.post('/', recurringController.createPattern);
router.post('/trigger-cron', recurringController.triggerCron);
router.put('/:id', recurringController.updatePattern);
router.delete('/:id', recurringController.deletePattern);

module.exports = router;
