// Security Routes for People X
const express = require('express');
const securityController = require('./securityController');
const { authenticateToken, checkRole } = require('../../middleware/auth');
const { auditLog, rateLimit, setSecurityHeaders, handleDataAccessRequest, handleDataDeletionRequest } = require('../../middleware/security');

const router = express.Router();

// Apply security headers to all routes
router.use(setSecurityHeaders);

// Apply rate limiting to authentication routes
const authRateLimit = rateLimit(100, 60 * 60 * 1000); // 100 requests per hour

// Authentication routes (no authentication required)
router.post('/register', authRateLimit, securityController.registerUser);
router.post('/login', authRateLimit, securityController.loginUser);

// All routes below require authentication
router.use(authenticateToken);

// User profile routes
router.get('/profile', securityController.getUserProfile);
router.put('/profile', securityController.updateUserProfile);

// Invitation routes
router.post('/invitations', checkRole(['admin', 'hr_manager']), securityController.createInvitation);

// Audit log routes
router.get('/audit-logs', checkRole(['admin', 'security_admin', 'data_protection_officer']), securityController.getAuditLogs);

// Login history routes
router.get('/login-history', securityController.getLoginHistory);

// GDPR data access routes
router.get('/data-access/:user_id', (req, res) => handleDataAccessRequest(req, res));
router.post('/data-deletion/:user_id', (req, res) => handleDataDeletionRequest(req, res));

module.exports = router;
