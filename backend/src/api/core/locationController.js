// Location Controller for People X
const { pgPool } = require('../../config/database');

/**
 * Get all locations for an organization
 */
const getLocations = async (req, res) => {
  const { organizationId } = req.query;
  
  if (!organizationId) {
    return res.status(400).json({ error: 'Organization ID is required' });
  }
  
  try {
    const result = await pgPool.query(
      `SELECT id, name, address, city, state, country, postal_code, created_at, updated_at
      FROM core.locations
      WHERE organization_id = $1
      ORDER BY name`,
      [organizationId]
    );
    
    res.status(200).json({
      locations: result.rows
    });
  } catch (error) {
    console.error('Get locations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get location by ID
 */
const getLocationById = async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pgPool.query(
      `SELECT id, organization_id, name, address, city, state, country, postal_code, created_at, updated_at
      FROM core.locations
      WHERE id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Location not found' });
    }
    
    // Get employees at this location
    const employeesResult = await pgPool.query(
      `SELECT id, employee_id, first_name, last_name, job_title_id, 
      (SELECT title FROM core.job_titles WHERE id = job_title_id) as job_title
      FROM hr.employees
      WHERE location_id = $1
      ORDER BY first_name, last_name`,
      [id]
    );
    
    const location = {
      ...result.rows[0],
      employees: employeesResult.rows
    };
    
    res.status(200).json({
      location
    });
  } catch (error) {
    console.error('Get location error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Create new location
 */
const createLocation = async (req, res) => {
  const { organization_id, name, address, city, state, country, postal_code } = req.body;
  
  if (!organization_id || !name) {
    return res.status(400).json({ error: 'Organization ID and name are required' });
  }
  
  try {
    const result = await pgPool.query(
      `INSERT INTO core.locations 
      (organization_id, name, address, city, state, country, postal_code, created_at, updated_at) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
      RETURNING id, organization_id, name, address, city, state, country, postal_code, created_at`,
      [organization_id, name, address, city, state, country, postal_code]
    );
    
    res.status(201).json({
      message: 'Location created successfully',
      location: result.rows[0]
    });
  } catch (error) {
    console.error('Create location error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update location
 */
const updateLocation = async (req, res) => {
  const { id } = req.params;
  const { name, address, city, state, country, postal_code } = req.body;
  
  try {
    // Check if location exists
    const locCheck = await pgPool.query(
      'SELECT id FROM core.locations WHERE id = $1',
      [id]
    );
    
    if (locCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Location not found' });
    }
    
    const result = await pgPool.query(
      `UPDATE core.locations 
      SET name = COALESCE($1, name), 
          address = COALESCE($2, address), 
          city = COALESCE($3, city), 
          state = COALESCE($4, state),
          country = COALESCE($5, country),
          postal_code = COALESCE($6, postal_code),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING id, organization_id, name, address, city, state, country, postal_code, created_at, updated_at`,
      [name, address, city, state, country, postal_code, id]
    );
    
    res.status(200).json({
      message: 'Location updated successfully',
      location: result.rows[0]
    });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Delete location
 */
const deleteLocation = async (req, res) => {
  const { id } = req.params;
  
  try {
    // Check if location exists
    const locCheck = await pgPool.query(
      'SELECT id FROM core.locations WHERE id = $1',
      [id]
    );
    
    if (locCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Location not found' });
    }
    
    // Check if location has employees
    const empCheck = await pgPool.query(
      'SELECT id FROM hr.employees WHERE location_id = $1 LIMIT 1',
      [id]
    );
    
    if (empCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Cannot delete location with assigned employees' });
    }
    
    await pgPool.query(
      'DELETE FROM core.locations WHERE id = $1',
      [id]
    );
    
    res.status(200).json({
      message: 'Location deleted successfully'
    });
  } catch (error) {
    console.error('Delete location error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getLocations,
  getLocationById,
  createLocation,
  updateLocation,
  deleteLocation
};
