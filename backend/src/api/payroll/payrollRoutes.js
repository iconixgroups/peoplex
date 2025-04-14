// Payroll Routes for People X
const express = require('express');
const payrollController = require('./payrollController');
const { authenticateToken, checkRole, checkPermission } = require('../../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Payroll Periods
router.get('/periods', checkRole(['admin', 'hr_manager', 'finance_manager']), payrollController.getPayrollPeriods);
router.get('/periods/:id', checkRole(['admin', 'hr_manager', 'finance_manager']), payrollController.getPayrollPeriodById);
router.post('/periods', checkRole(['admin', 'hr_manager', 'finance_manager']), payrollController.createPayrollPeriod);
router.put('/periods/:id', checkRole(['admin', 'hr_manager', 'finance_manager']), payrollController.updatePayrollPeriod);

// Payroll Runs
router.post('/periods/:payroll_period_id/runs', checkRole(['admin', 'hr_manager', 'finance_manager']), payrollController.createPayrollRun);
router.get('/runs/:id', checkRole(['admin', 'hr_manager', 'finance_manager']), payrollController.getPayrollRunById);

// Payslips
router.get('/payslips/:id', payrollController.getPayslipById);
router.get('/employee/:employee_id/payslips', payrollController.getEmployeePayslips);

module.exports = router;
