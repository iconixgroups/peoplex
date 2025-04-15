const express = require('express');
const router = express.Router();
const { authenticate } = require('../../../middleware/auth');
const { authorize } = require('../../../middleware/authorize');
const performanceController = require('./performanceController');

// Review Cycles
router.get('/cycles', 
  authenticate, 
  authorize(['hr_admin', 'manager']), 
  performanceController.getReviewCycles
);

router.post('/cycles', 
  authenticate, 
  authorize(['hr_admin']), 
  performanceController.createReviewCycle
);

// Performance Reviews
router.get('/reviews', 
  authenticate, 
  authorize(['hr_admin', 'manager']), 
  performanceController.getPerformanceReviews
);

router.post('/reviews', 
  authenticate, 
  authorize(['hr_admin', 'manager']), 
  performanceController.createPerformanceReview
);

// Goals
router.get('/goals', 
  authenticate, 
  authorize(['hr_admin', 'manager', 'employee']), 
  performanceController.getGoals
);

router.post('/goals', 
  authenticate, 
  authorize(['hr_admin', 'manager']), 
  performanceController.createGoal
);

// Competencies
router.get('/competencies', 
  authenticate, 
  authorize(['hr_admin', 'manager', 'employee']), 
  performanceController.getCompetencies
);

router.post('/competencies', 
  authenticate, 
  authorize(['hr_admin', 'manager']), 
  performanceController.createCompetency
);

// Competency Assessments
router.get('/competency-assessments', 
  authenticate, 
  authorize(['hr_admin', 'manager']), 
  performanceController.getCompetencyAssessments
);

router.post('/competency-assessments', 
  authenticate, 
  authorize(['hr_admin', 'manager']), 
  performanceController.createCompetencyAssessment
);

module.exports = router; 