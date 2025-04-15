// Form Routes for People X
const express = require('express');
const formController = require('./formController');
const { authenticateToken, checkRole, checkPermission } = require('../../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all forms
router.get('/', formController.getForms);

// Get form by ID
router.get('/:id', formController.getFormById);

// Create new form - Admin or HR manager only
router.post('/', checkRole(['admin', 'hr_manager']), formController.createForm);

// Update form - Admin or HR manager only
router.put('/:id', checkRole(['admin', 'hr_manager']), formController.updateForm);

// Delete form - Admin or HR manager only
router.delete('/:id', checkRole(['admin', 'hr_manager']), formController.deleteForm);

// Submit form response
router.post('/:id/submit', formController.submitFormResponse);

// Get form responses - Admin or HR manager only
router.get('/:id/responses', checkRole(['admin', 'hr_manager']), formController.getFormResponses);

// Get form response by ID
router.get('/responses/:responseId', formController.getFormResponseById);

module.exports = router; 