// Department Routes for People X
const express = require('express');
const departmentController = require('./departmentController');
const { authenticateToken, checkRole, checkPermission } = require('../../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all departments
router.get('/', departmentController.getDepartments);

// Get department by ID
router.get('/:id', departmentController.getDepartmentById);

// Create new department - Admin or HR manager only
router.post('/', checkRole(['admin', 'hr_manager']), departmentController.createDepartment);

// Update department - Admin or HR manager only
router.put('/:id', checkRole(['admin', 'hr_manager']), departmentController.updateDepartment);

// Delete department - Admin only
router.delete('/:id', checkRole(['admin']), departmentController.deleteDepartment);

module.exports = router;
