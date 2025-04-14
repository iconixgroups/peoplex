// Salary Routes for People X
const express = require('express');
const salaryController = require('./salaryController');
const { authenticateToken, checkRole, checkPermission } = require('../../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Salary Structures
router.get('/structures', checkRole(['admin', 'hr_manager', 'finance_manager']), salaryController.getSalaryStructures);
router.get('/structures/:id', checkRole(['admin', 'hr_manager', 'finance_manager']), salaryController.getSalaryStructureById);
router.post('/structures', checkRole(['admin', 'hr_manager', 'finance_manager']), salaryController.createSalaryStructure);
router.put('/structures/:id', checkRole(['admin', 'hr_manager', 'finance_manager']), salaryController.updateSalaryStructure);

// Salary Grades
router.post('/structures/:structure_id/grades', checkRole(['admin', 'hr_manager', 'finance_manager']), salaryController.addSalaryGrade);
router.put('/grades/:grade_id', checkRole(['admin', 'hr_manager', 'finance_manager']), salaryController.updateSalaryGrade);
router.delete('/grades/:grade_id', checkRole(['admin', 'hr_manager', 'finance_manager']), salaryController.deleteSalaryGrade);

// Employee Salaries
router.get('/employee/:employee_id', checkRole(['admin', 'hr_manager', 'finance_manager']), salaryController.getEmployeeSalaryHistory);
router.post('/employee', checkRole(['admin', 'hr_manager', 'finance_manager']), salaryController.addEmployeeSalary);
router.delete('/:salary_id', checkRole(['admin', 'hr_manager', 'finance_manager']), salaryController.deleteEmployeeSalary);

module.exports = router;
