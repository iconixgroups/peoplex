// Learning Routes for People X
const express = require('express');
const { authenticateToken, checkRole } = require('../../../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Basic routes (placeholder)
router.get('/', (req, res) => {
  res.status(200).json({ message: 'Learning API endpoint' });
});

module.exports = router; 