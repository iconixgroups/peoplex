// Candidate Routes for People X
const express = require('express');
const candidateController = require('./candidateController');
const { authenticateToken, checkRole, checkPermission } = require('../../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all candidates
router.get('/', checkRole(['admin', 'hr_manager', 'recruiter']), candidateController.getCandidates);

// Get candidate by ID
router.get('/:id', checkRole(['admin', 'hr_manager', 'recruiter']), candidateController.getCandidateById);

// Create new candidate
router.post('/', checkRole(['admin', 'hr_manager', 'recruiter']), candidateController.createCandidate);

// Update candidate
router.put('/:id', checkRole(['admin', 'hr_manager', 'recruiter']), candidateController.updateCandidate);

// Upload candidate document
router.post('/:candidate_id/documents', checkRole(['admin', 'hr_manager', 'recruiter']), candidateController.uploadDocument);

// Delete candidate
router.delete('/:id', checkRole(['admin', 'hr_manager']), candidateController.deleteCandidate);

module.exports = router;
