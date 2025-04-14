// Attendance Routes for People X
const express = require('express');
const attendanceController = require('./attendanceController');
const { authenticateToken, checkRole, checkPermission } = require('../../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get attendance records for an employee
router.get('/employee/:employee_id', attendanceController.getEmployeeAttendance);

// Get attendance records for all employees in an organization
router.get('/organization', checkRole(['admin', 'hr_manager', 'manager']), attendanceController.getOrganizationAttendance);

// Record check-in
router.post('/employee/:employee_id/check-in', attendanceController.checkIn);

// Record check-out
router.post('/employee/:employee_id/check-out', attendanceController.checkOut);

// Update attendance record - Admin or HR manager only
router.put('/:id', checkRole(['admin', 'hr_manager']), attendanceController.updateAttendance);

module.exports = router;
