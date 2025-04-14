// Interview Routes for People X
const express = require('express');
const interviewController = require('./interviewController');
const { authenticateToken, checkRole, checkPermission } = require('../../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get interviews by application
router.get('/application/:application_id', checkRole(['admin', 'hr_manager', 'recruiter']), interviewController.getInterviewsByApplication);

// Get interviews by interviewer
router.get('/interviewer/:interviewer_id', interviewController.getInterviewsByInterviewer);

// Get interview by ID
router.get('/:id', checkRole(['admin', 'hr_manager', 'recruiter', 'interviewer']), interviewController.getInterviewById);

// Schedule new interview
router.post('/', checkRole(['admin', 'hr_manager', 'recruiter']), interviewController.scheduleInterview);

// Update interview
router.put('/:id', checkRole(['admin', 'hr_manager', 'recruiter', 'interviewer']), interviewController.updateInterview);

// Delete interview
router.delete('/:id', checkRole(['admin', 'hr_manager']), interviewController.deleteInterview);

module.exports = router;
