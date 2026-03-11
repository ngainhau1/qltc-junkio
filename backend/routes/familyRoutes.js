const express = require('express');
const router = express.Router();
const familyController = require('../controllers/familyController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', familyController.getUserFamilies);
router.post('/', familyController.createFamily);
router.get('/:id', familyController.getFamilyDetails);
router.post('/:id/members', familyController.addMember);
router.delete('/:id/members/:userIdToRemove', familyController.removeMember);
router.delete('/:id', familyController.deleteFamily);

module.exports = router;
