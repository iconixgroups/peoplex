// Job Title Routes for People X
const express = require('express');
const jobTitleController = require('./jobTitleController');
const { authenticateToken, checkRole, checkPermission } = require('../../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all job titles
router.get('/', jobTitleController.getJobTitles);

// Get job title by ID
router.get('/:id', jobTitleController.getJobTitleById);

// Create new job title - Admin or HR manager only
router.post('/', checkRole(['admin', 'hr_manager']), jobTitleController.createJobTitle);

// Update job title - Admin or HR manager only
router.put('/:id', checkRole(['admin', 'hr_manager']), jobTitleController.updateJobTitle);

// Delete job title - Admin only
router.delete('/:id', checkRole(['admin']), jobTitleController.deleteJobTitle);

module.exports = router;
