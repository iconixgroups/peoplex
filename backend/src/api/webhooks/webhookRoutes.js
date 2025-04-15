// Webhook Routes for People X
const express = require('express');
const webhookController = require('./webhookController');
const { authenticateToken, checkRole } = require('../../middleware/auth');

const router = express.Router();

// Webhook receiver endpoints
router.post('/receive/:type', webhookController.receiveWebhook);

// Routes below require authentication
router.use(authenticateToken);

// Get all webhooks
router.get('/', checkRole(['admin', 'system_admin']), webhookController.getWebhooks);

// Get webhook by ID
router.get('/:id', checkRole(['admin', 'system_admin']), webhookController.getWebhookById);

// Create new webhook
router.post('/', checkRole(['admin', 'system_admin']), webhookController.createWebhook);

// Update webhook
router.put('/:id', checkRole(['admin', 'system_admin']), webhookController.updateWebhook);

// Delete webhook
router.delete('/:id', checkRole(['admin', 'system_admin']), webhookController.deleteWebhook);

// Test webhook
router.post('/:id/test', checkRole(['admin', 'system_admin']), webhookController.testWebhook);

module.exports = router; 