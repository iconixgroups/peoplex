// Form Builder Routes for People X
const express = require('express');
const formBuilderController = require('./formBuilderController');
const { authenticateToken, checkRole, checkPermission } = require('../../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Form Templates
router.get('/templates', formBuilderController.getFormTemplates);
router.get('/templates/:id', formBuilderController.getFormTemplateById);
router.post('/templates', checkRole(['admin', 'hr_manager', 'system_admin']), formBuilderController.createFormTemplate);
router.put('/templates/:id', checkRole(['admin', 'hr_manager', 'system_admin']), formBuilderController.updateFormTemplate);
router.delete('/templates/:id', checkRole(['admin', 'hr_manager', 'system_admin']), formBuilderController.deleteFormTemplate);

// Form Fields
router.post('/templates/:form_template_id/fields', checkRole(['admin', 'hr_manager', 'system_admin']), formBuilderController.addFormField);
router.put('/fields/:field_id', checkRole(['admin', 'hr_manager', 'system_admin']), formBuilderController.updateFormField);
router.delete('/fields/:field_id', checkRole(['admin', 'hr_manager', 'system_admin']), formBuilderController.deleteFormField);

// Form Submissions
router.post('/submit', formBuilderController.submitForm);
router.get('/submissions', formBuilderController.getFormSubmissions);
router.get('/submissions/:id', formBuilderController.getFormSubmissionById);

module.exports = router;
