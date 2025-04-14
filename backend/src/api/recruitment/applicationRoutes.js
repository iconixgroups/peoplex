// Application Routes for People X
const express = require('express');
const applicationController = require('./applicationController');
const { authenticateToken, checkRole, checkPermission } = require('../../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get applications by job posting
router.get('/job-posting/:job_posting_id', checkRole(['admin', 'hr_manager', 'recruiter']), applicationController.getApplicationsByJobPosting);

// Get applications by candidate
router.get('/candidate/:candidate_id', checkRole(['admin', 'hr_manager', 'recruiter']), applicationController.getApplicationsByCandidate);

// Get application by ID
router.get('/:id', checkRole(['admin', 'hr_manager', 'recruiter']), applicationController.getApplicationById);

// Create new application
router.post('/', checkRole(['admin', 'hr_manager', 'recruiter']), applicationController.createApplication);

// Update application status
router.put('/:id/status', checkRole(['admin', 'hr_manager', 'recruiter']), applicationController.updateApplicationStatus);

// Delete application
router.delete('/:id', checkRole(['admin', 'hr_manager']), applicationController.deleteApplication);

module.exports = router;
