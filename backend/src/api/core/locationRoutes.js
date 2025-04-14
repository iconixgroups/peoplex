// Location Routes for People X
const express = require('express');
const locationController = require('./locationController');
const { authenticateToken, checkRole, checkPermission } = require('../../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all locations
router.get('/', locationController.getLocations);

// Get location by ID
router.get('/:id', locationController.getLocationById);

// Create new location - Admin or HR manager only
router.post('/', checkRole(['admin', 'hr_manager']), locationController.createLocation);

// Update location - Admin or HR manager only
router.put('/:id', checkRole(['admin', 'hr_manager']), locationController.updateLocation);

// Delete location - Admin only
router.delete('/:id', checkRole(['admin']), locationController.deleteLocation);

module.exports = router;
