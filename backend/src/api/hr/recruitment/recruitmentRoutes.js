const express = require('express');
const router = express.Router();
const recruitmentController = require('./recruitmentController');
const { authenticateUser, authorizeHR } = require('../../../middleware/auth');

// Job Requisition Routes
router.get('/requisitions', 
  authenticateUser, 
  authorizeHR, 
  recruitmentController.getRequisitions
);

router.get('/requisitions/:id', 
  authenticateUser, 
  authorizeHR, 
  recruitmentController.getRequisitionById
);

router.post('/requisitions', 
  authenticateUser, 
  authorizeHR, 
  recruitmentController.createRequisition
);

router.put('/requisitions/:id', 
  authenticateUser, 
  authorizeHR, 
  recruitmentController.updateRequisition
);

router.delete('/requisitions/:id', 
  authenticateUser, 
  authorizeHR, 
  recruitmentController.deleteRequisition
);

// Candidate Routes
router.get('/candidates', 
  authenticateUser, 
  authorizeHR, 
  recruitmentController.getCandidates
);

router.get('/candidates/:id', 
  authenticateUser, 
  authorizeHR, 
  recruitmentController.getCandidateById
);

router.post('/candidates', 
  authenticateUser, 
  authorizeHR, 
  recruitmentController.createCandidate
);

router.put('/candidates/:id', 
  authenticateUser, 
  authorizeHR, 
  recruitmentController.updateCandidate
);

router.delete('/candidates/:id', 
  authenticateUser, 
  authorizeHR, 
  recruitmentController.deleteCandidate
);

// Interview Routes
router.get('/interviews', 
  authenticateUser, 
  authorizeHR, 
  recruitmentController.getInterviews
);

router.get('/interviews/:id', 
  authenticateUser, 
  authorizeHR, 
  recruitmentController.getInterviewById
);

router.post('/interviews', 
  authenticateUser, 
  authorizeHR, 
  recruitmentController.scheduleInterview
);

router.put('/interviews/:id', 
  authenticateUser, 
  authorizeHR, 
  recruitmentController.updateInterview
);

router.delete('/interviews/:id', 
  authenticateUser, 
  authorizeHR, 
  recruitmentController.cancelInterview
);

// Offer Routes
router.get('/offers', 
  authenticateUser, 
  authorizeHR, 
  recruitmentController.getOffers
);

router.get('/offers/:id', 
  authenticateUser, 
  authorizeHR, 
  recruitmentController.getOfferById
);

router.post('/offers', 
  authenticateUser, 
  authorizeHR, 
  recruitmentController.createOffer
);

router.put('/offers/:id', 
  authenticateUser, 
  authorizeHR, 
  recruitmentController.updateOffer
);

router.delete('/offers/:id', 
  authenticateUser, 
  authorizeHR, 
  recruitmentController.deleteOffer
);

// Onboarding Routes
router.get('/onboarding-plans', 
  authenticateUser, 
  authorizeHR, 
  recruitmentController.getOnboardingPlans
);

router.get('/onboarding-plans/:id', 
  authenticateUser, 
  authorizeHR, 
  recruitmentController.getOnboardingPlanById
);

router.post('/onboarding-plans', 
  authenticateUser, 
  authorizeHR, 
  recruitmentController.createOnboardingPlan
);

router.put('/onboarding-plans/:id', 
  authenticateUser, 
  authorizeHR, 
  recruitmentController.updateOnboardingPlan
);

router.delete('/onboarding-plans/:id', 
  authenticateUser, 
  authorizeHR, 
  recruitmentController.deleteOnboardingPlan
);

module.exports = router; 