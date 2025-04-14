// AI Assistant Routes for People X
const express = require('express');
const aiAssistantController = require('./aiAssistantController');
const { authenticateToken, checkRole } = require('../../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// AI Assistant endpoints
router.post('/query', aiAssistantController.processQuery);
router.post('/suggested-actions', aiAssistantController.getSuggestedActions);
router.post('/insights', aiAssistantController.getInsights);
router.post('/generate-content', aiAssistantController.generateContent);

module.exports = router;
