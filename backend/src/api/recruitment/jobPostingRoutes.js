// Job Posting Routes for People X
const express = require('express');
const jobPostingController = require('./jobPostingController');
const { authenticateToken, checkRole, checkPermission } = require('../../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all job postings
router.get('/', jobPostingController.getJobPostings);

// Get job posting by ID
router.get('/:id', jobPostingController.getJobPostingById);

// Create new job posting - HR manager or recruiter only
router.post('/', checkRole(['admin', 'hr_manager', 'recruiter']), jobPostingController.createJobPosting);

// Update job posting - HR manager or recruiter only
router.put('/:id', checkRole(['admin', 'hr_manager', 'recruiter']), jobPostingController.updateJobPosting);

// Delete job posting - HR manager or admin only
router.delete('/:id', checkRole(['admin', 'hr_manager']), jobPostingController.deleteJobPosting);

module.exports = router;
