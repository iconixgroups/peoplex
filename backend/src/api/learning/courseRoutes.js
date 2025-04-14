// Course Routes for People X
const express = require('express');
const courseController = require('./courseController');
const { authenticateToken, checkRole, checkPermission } = require('../../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Courses
router.get('/', courseController.getCourses);
router.get('/:id', courseController.getCourseById);
router.post('/', checkRole(['admin', 'hr_manager', 'learning_admin']), courseController.createCourse);
router.put('/:id', checkRole(['admin', 'hr_manager', 'learning_admin']), courseController.updateCourse);
router.delete('/:id', checkRole(['admin', 'hr_manager', 'learning_admin']), courseController.deleteCourse);

// Course Modules
router.post('/:course_id/modules', checkRole(['admin', 'hr_manager', 'learning_admin']), courseController.addCourseModule);
router.put('/modules/:module_id', checkRole(['admin', 'hr_manager', 'learning_admin']), courseController.updateCourseModule);
router.delete('/modules/:module_id', checkRole(['admin', 'hr_manager', 'learning_admin']), courseController.deleteCourseModule);

module.exports = router;
