const express = require('express');
const router = express.Router();
const { authenticate } = require('../../../middleware/auth');
const { authorize } = require('../../../middleware/authorize');
const payrollController = require('./payrollController');

// Payroll Runs
router.get('/runs', 
  authenticate, 
  authorize(['hr_admin', 'payroll_admin']), 
  payrollController.getPayrollRuns
);

router.post('/runs', 
  authenticate, 
  authorize(['hr_admin', 'payroll_admin']), 
  payrollController.createPayrollRun
);

// Payroll Entries
router.get('/entries', 
  authenticate, 
  authorize(['hr_admin', 'payroll_admin', 'manager']), 
  payrollController.getPayrollEntries
);

router.post('/entries', 
  authenticate, 
  authorize(['hr_admin', 'payroll_admin']), 
  payrollController.createPayrollEntry
);

// Tax Configurations
router.get('/tax-configurations', 
  authenticate, 
  authorize(['hr_admin', 'payroll_admin']), 
  payrollController.getTaxConfigurations
);

router.post('/tax-configurations', 
  authenticate, 
  authorize(['hr_admin']), 
  payrollController.createTaxConfiguration
);

// Benefits
router.get('/benefits', 
  authenticate, 
  authorize(['hr_admin', 'payroll_admin', 'manager']), 
  payrollController.getBenefits
);

router.post('/benefits', 
  authenticate, 
  authorize(['hr_admin']), 
  payrollController.createBenefit
);

// Salary Components
router.get('/components', 
  authenticate, 
  authorize(['hr_admin', 'payroll_admin']), 
  payrollController.getSalaryComponents
);

router.post('/components', 
  authenticate, 
  authorize(['hr_admin', 'payroll_admin']), 
  payrollController.createSalaryComponent
);

// Tax Calculations
router.get('/tax', 
  authenticate, 
  authorize(['hr_admin', 'payroll_admin']), 
  payrollController.getTaxCalculations
);

router.post('/tax', 
  authenticate, 
  authorize(['hr_admin', 'payroll_admin']), 
  payrollController.createTaxCalculation
);

module.exports = router; 