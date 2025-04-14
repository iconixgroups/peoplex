// Goal Routes for People X
const express = require('express');
const goalController = require('./goalController');
const { authenticateToken, checkRole, checkPermission } = require('../../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get employee goals
router.get('/employee/:employee_id', goalController.getEmployeeGoals);

// Get goals assigned by manager
router.get('/assigned/:manager_id', goalController.getAssignedGoals);

// Get goal by ID
router.get('/:id', goalController.getGoalById);

// Create new goal
router.post('/', goalController.createGoal);

// Update goal
router.put('/:id', goalController.updateGoal);

// Add goal update
router.post('/:goal_id/updates', goalController.addGoalUpdate);

// Delete goal
router.delete('/:id', checkRole(['admin', 'hr_manager', 'manager']), goalController.deleteGoal);

module.exports = router;
