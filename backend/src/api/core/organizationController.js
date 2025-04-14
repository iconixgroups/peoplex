// Organization Controller for People X
const { pgPool } = require('../../config/database');

/**
 * Get all organizations
 */
const getAllOrganizations = async (req, res) => {
  try {
    const result = await pgPool.query(
      'SELECT id, name, code, domain, logo_url, created_at FROM core.organizations'
    );
    
    res.status(200).json({
      organizations: result.rows
    });
  } catch (error) {
    console.error('Get organizations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get organization by ID
 */
const getOrganizationById = async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pgPool.query(
      'SELECT id, name, code, domain, logo_url, created_at FROM core.organizations WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    res.status(200).json({
      organization: result.rows[0]
    });
  } catch (error) {
    console.error('Get organization error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Create new organization
 */
const createOrganization = async (req, res) => {
  const { name, code, domain, logo_url } = req.body;
  
  try {
    // Check if organization with same code already exists
    if (code) {
      const codeCheck = await pgPool.query(
        'SELECT id FROM core.organizations WHERE code = $1',
        [code]
      );
      
      if (codeCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Organization with this code already exists' });
      }
    }
    
    const result = await pgPool.query(
      `INSERT INTO core.organizations 
      (name, code, domain, logo_url, created_at, updated_at) 
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
      RETURNING id, name, code, domain, logo_url, created_at`,
      [name, code, domain, logo_url]
    );
    
    res.status(201).json({
      message: 'Organization created successfully',
      organization: result.rows[0]
    });
  } catch (error) {
    console.error('Create organization error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update organization
 */
const updateOrganization = async (req, res) => {
  const { id } = req.params;
  const { name, code, domain, logo_url } = req.body;
  
  try {
    // Check if organization exists
    const orgCheck = await pgPool.query(
      'SELECT id FROM core.organizations WHERE id = $1',
      [id]
    );
    
    if (orgCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    // Check if code is unique if provided
    if (code) {
      const codeCheck = await pgPool.query(
        'SELECT id FROM core.organizations WHERE code = $1 AND id != $2',
        [code, id]
      );
      
      if (codeCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Organization with this code already exists' });
      }
    }
    
    const result = await pgPool.query(
      `UPDATE core.organizations 
      SET name = COALESCE($1, name), 
          code = COALESCE($2, code), 
          domain = COALESCE($3, domain), 
          logo_url = COALESCE($4, logo_url),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING id, name, code, domain, logo_url, created_at, updated_at`,
      [name, code, domain, logo_url, id]
    );
    
    res.status(200).json({
      message: 'Organization updated successfully',
      organization: result.rows[0]
    });
  } catch (error) {
    console.error('Update organization error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Delete organization
 */
const deleteOrganization = async (req, res) => {
  const { id } = req.params;
  
  try {
    // Check if organization exists
    const orgCheck = await pgPool.query(
      'SELECT id FROM core.organizations WHERE id = $1',
      [id]
    );
    
    if (orgCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    // Check if organization has departments
    const deptCheck = await pgPool.query(
      'SELECT id FROM core.departments WHERE organization_id = $1 LIMIT 1',
      [id]
    );
    
    if (deptCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Cannot delete organization with existing departments' });
    }
    
    // Check if organization has employees
    const empCheck = await pgPool.query(
      'SELECT id FROM hr.employees WHERE organization_id = $1 LIMIT 1',
      [id]
    );
    
    if (empCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Cannot delete organization with existing employees' });
    }
    
    await pgPool.query(
      'DELETE FROM core.organizations WHERE id = $1',
      [id]
    );
    
    res.status(200).json({
      message: 'Organization deleted successfully'
    });
  } catch (error) {
    console.error('Delete organization error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getAllOrganizations,
  getOrganizationById,
  createOrganization,
  updateOrganization,
  deleteOrganization
};
