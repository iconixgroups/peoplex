// Review Template Routes for People X
const express = require('express');
const reviewTemplateController = require('./reviewTemplateController');
const { authenticateToken, checkRole, checkPermission } = require('../../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Review Templates
router.get('/', checkRole(['admin', 'hr_manager', 'manager']), reviewTemplateController.getReviewTemplates);
router.get('/:id', checkRole(['admin', 'hr_manager', 'manager']), reviewTemplateController.getReviewTemplateById);
router.post('/', checkRole(['admin', 'hr_manager']), reviewTemplateController.createReviewTemplate);
router.put('/:id', checkRole(['admin', 'hr_manager']), reviewTemplateController.updateReviewTemplate);
router.delete('/:id', checkRole(['admin', 'hr_manager']), reviewTemplateController.deleteReviewTemplate);

// Template Questions
router.post('/:template_id/questions', checkRole(['admin', 'hr_manager']), reviewTemplateController.addQuestion);
router.put('/questions/:question_id', checkRole(['admin', 'hr_manager']), reviewTemplateController.updateQuestion);
router.delete('/questions/:question_id', checkRole(['admin', 'hr_manager']), reviewTemplateController.deleteQuestion);

module.exports = router;
