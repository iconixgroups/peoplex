// Dashboard Routes for People X
const express = require('express');
const dashboardController = require('./dashboardController');
const { authenticateToken, checkRole, checkPermission } = require('../../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get admin dashboard data
router.get('/admin', checkRole(['admin', 'hr_manager']), dashboardController.getAdminDashboard);

// Get manager dashboard data
router.get('/manager', checkRole(['admin', 'hr_manager', 'manager']), dashboardController.getManagerDashboard);

// Get employee dashboard data
router.get('/employee', dashboardController.getEmployeeDashboard);

// Get dashboard widgets
router.get('/widgets', dashboardController.getDashboardWidgets);

// Get dashboard widget by ID
router.get('/widgets/:id', dashboardController.getDashboardWidgetById);

// Create custom dashboard
router.post('/custom', dashboardController.createCustomDashboard);

// Update custom dashboard
router.put('/custom/:id', dashboardController.updateCustomDashboard);

// Delete custom dashboard
router.delete('/custom/:id', dashboardController.deleteCustomDashboard);

module.exports = router; 