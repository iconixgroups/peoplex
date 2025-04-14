// Leave Routes for People X
const express = require('express');
const leaveController = require('./leaveController');
const { authenticateToken, checkRole, checkPermission } = require('../../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Leave types
router.get('/types', leaveController.getLeaveTypes);
router.post('/types', checkRole(['admin', 'hr_manager']), leaveController.createLeaveType);

// Leave balances
router.get('/balances/employee/:employee_id', leaveController.getEmployeeLeaveBalances);

// Leave requests
router.get('/requests/employee/:employee_id', leaveController.getEmployeeLeaveRequests);
router.get('/requests/approval', checkRole(['admin', 'hr_manager', 'manager']), leaveController.getLeaveRequestsForApproval);
router.post('/requests', leaveController.createLeaveRequest);
router.put('/requests/:id/process', checkRole(['admin', 'hr_manager', 'manager']), leaveController.processLeaveRequest);
router.put('/requests/:id/cancel', leaveController.cancelLeaveRequest);

module.exports = router;
