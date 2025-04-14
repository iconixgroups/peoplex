// Employee Routes for People X
const express = require('express');
const employeeController = require('./employeeController');
const { authenticateToken, checkRole, checkPermission } = require('../../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all employees
router.get('/', employeeController.getEmployees);

// Get employee by ID
router.get('/:id', employeeController.getEmployeeById);

// Create new employee - Admin or HR manager only
router.post('/', checkRole(['admin', 'hr_manager']), employeeController.createEmployee);

// Update employee - Admin, HR manager, or the employee themselves
router.put('/:id', employeeController.updateEmployee);

// Upload employee document
router.post('/:employee_id/documents', employeeController.uploadDocument);

// Verify employee document - Admin or HR manager only
router.put('/documents/:document_id/verify', checkRole(['admin', 'hr_manager']), employeeController.verifyDocument);

module.exports = router;
