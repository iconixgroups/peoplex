// Analytics Routes for People X
const express = require('express');
const analyticsController = require('./analyticsController');
const { authenticateToken, checkRole } = require('../../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Dashboard endpoints
router.get('/hr-overview', checkRole(['admin', 'hr_manager', 'executive']), analyticsController.getHrOverviewDashboard);
router.get('/recruitment', checkRole(['admin', 'hr_manager', 'recruiter', 'executive']), analyticsController.getRecruitmentDashboard);
router.get('/performance', checkRole(['admin', 'hr_manager', 'manager', 'executive']), analyticsController.getPerformanceDashboard);
router.get('/learning', checkRole(['admin', 'hr_manager', 'learning_admin', 'executive']), analyticsController.getLearningDashboard);
router.get('/compensation', checkRole(['admin', 'hr_manager', 'finance_manager', 'executive']), analyticsController.getCompensationDashboard);

module.exports = router;
