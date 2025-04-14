// Performance Review Routes for People X
const express = require('express');
const performanceReviewController = require('./performanceReviewController');
const { authenticateToken, checkRole, checkPermission } = require('../../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Review Cycles
router.get('/cycles', checkRole(['admin', 'hr_manager', 'manager']), performanceReviewController.getReviewCycles);
router.get('/cycles/:id', checkRole(['admin', 'hr_manager', 'manager']), performanceReviewController.getReviewCycleById);
router.post('/cycles', checkRole(['admin', 'hr_manager']), performanceReviewController.createReviewCycle);
router.put('/cycles/:id', checkRole(['admin', 'hr_manager']), performanceReviewController.updateReviewCycle);
router.post('/cycles/:id/launch', checkRole(['admin', 'hr_manager']), performanceReviewController.launchReviewCycle);

// Reviews
router.get('/employee/:employee_id', performanceReviewController.getEmployeeReviews);
router.get('/reviewer/:reviewer_id', performanceReviewController.getReviewerTasks);
router.get('/:id', performanceReviewController.getReviewById);
router.post('/:id/submit', performanceReviewController.submitReview);

module.exports = router;
