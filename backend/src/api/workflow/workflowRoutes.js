// Workflow Routes for People X
const express = require('express');
const workflowController = require('./workflowController');
const { authenticateToken, checkRole, checkPermission } = require('../../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Workflow Definitions
router.get('/definitions', checkRole(['admin', 'hr_manager', 'system_admin']), workflowController.getWorkflowDefinitions);
router.get('/definitions/:id', checkRole(['admin', 'hr_manager', 'system_admin']), workflowController.getWorkflowDefinitionById);
router.post('/definitions', checkRole(['admin', 'hr_manager', 'system_admin']), workflowController.createWorkflowDefinition);
router.put('/definitions/:id', checkRole(['admin', 'hr_manager', 'system_admin']), workflowController.updateWorkflowDefinition);
router.delete('/definitions/:id', checkRole(['admin', 'hr_manager', 'system_admin']), workflowController.deleteWorkflowDefinition);

// Workflow Steps
router.post('/definitions/:workflow_definition_id/steps', checkRole(['admin', 'hr_manager', 'system_admin']), workflowController.addWorkflowStep);
router.put('/steps/:step_id', checkRole(['admin', 'hr_manager', 'system_admin']), workflowController.updateWorkflowStep);
router.delete('/steps/:step_id', checkRole(['admin', 'hr_manager', 'system_admin']), workflowController.deleteWorkflowStep);

// Workflow Instances
router.get('/instances', checkRole(['admin', 'hr_manager', 'system_admin']), workflowController.getWorkflowInstances);
router.get('/instances/:id', workflowController.getWorkflowInstanceById);
router.post('/trigger', workflowController.triggerWorkflow);

module.exports = router;
