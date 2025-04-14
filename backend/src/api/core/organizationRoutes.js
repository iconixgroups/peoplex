// Organization Routes for People X
const express = require('express');
const organizationController = require('./organizationController');
const { authenticateToken, checkRole, checkPermission } = require('../../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all organizations - Admin only
router.get('/', checkRole(['admin', 'super_admin']), organizationController.getAllOrganizations);

// Get organization by ID - Admin or user from that organization
router.get('/:id', organizationController.getOrganizationById);

// Create new organization - Super admin only
router.post('/', checkRole(['super_admin']), organizationController.createOrganization);

// Update organization - Admin or super admin
router.put('/:id', checkRole(['admin', 'super_admin']), organizationController.updateOrganization);

// Delete organization - Super admin only
router.delete('/:id', checkRole(['super_admin']), organizationController.deleteOrganization);

module.exports = router;
