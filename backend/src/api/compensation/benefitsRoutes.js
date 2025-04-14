// Benefits Routes for People X
const express = require('express');
const benefitsController = require('./benefitsController');
const { authenticateToken, checkRole, checkPermission } = require('../../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Benefit Plans
router.get('/plans', checkRole(['admin', 'hr_manager', 'finance_manager']), benefitsController.getBenefitPlans);
router.get('/plans/:id', checkRole(['admin', 'hr_manager', 'finance_manager']), benefitsController.getBenefitPlanById);
router.post('/plans', checkRole(['admin', 'hr_manager', 'finance_manager']), benefitsController.createBenefitPlan);
router.put('/plans/:id', checkRole(['admin', 'hr_manager', 'finance_manager']), benefitsController.updateBenefitPlan);
router.delete('/plans/:id', checkRole(['admin', 'hr_manager', 'finance_manager']), benefitsController.deleteBenefitPlan);

// Employee Benefits
router.get('/employee/:employee_id', checkRole(['admin', 'hr_manager', 'finance_manager']), benefitsController.getEmployeeBenefits);
router.post('/enroll', checkRole(['admin', 'hr_manager', 'finance_manager']), benefitsController.enrollEmployeeBenefit);
router.put('/:id', checkRole(['admin', 'hr_manager', 'finance_manager']), benefitsController.updateEmployeeBenefit);
router.put('/:id/terminate', checkRole(['admin', 'hr_manager', 'finance_manager']), benefitsController.terminateEmployeeBenefit);

module.exports = router;
