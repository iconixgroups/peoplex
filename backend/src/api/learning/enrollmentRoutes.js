// Enrollment Routes for People X
const express = require('express');
const enrollmentController = require('./enrollmentController');
const { authenticateToken, checkRole, checkPermission } = require('../../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Course Enrollments
router.get('/course/:course_id', checkRole(['admin', 'hr_manager', 'learning_admin', 'instructor']), enrollmentController.getCourseEnrollments);

// Employee Enrollments
router.get('/employee/:employee_id', enrollmentController.getEmployeeEnrollments);

// Get enrollment by ID
router.get('/:id', enrollmentController.getEnrollmentById);

// Enroll employee in course
router.post('/', checkRole(['admin', 'hr_manager', 'learning_admin', 'manager']), enrollmentController.enrollEmployee);

// Update enrollment status
router.put('/:id/status', checkRole(['admin', 'hr_manager', 'learning_admin', 'instructor']), enrollmentController.updateEnrollmentStatus);

// Update module progress
router.put('/:enrollment_id/modules/:module_id', enrollmentController.updateModuleProgress);

// Cancel enrollment
router.put('/:id/cancel', checkRole(['admin', 'hr_manager', 'learning_admin', 'manager']), enrollmentController.cancelEnrollment);

module.exports = router;
