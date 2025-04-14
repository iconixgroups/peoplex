// Job Title Controller for People X
const { pgPool } = require('../../config/database');

/**
 * Get all job titles for an organization
 */
const getJobTitles = async (req, res) => {
  const { organizationId } = req.query;
  
  if (!organizationId) {
    return res.status(400).json({ error: 'Organization ID is required' });
  }
  
  try {
    const result = await pgPool.query(
      `SELECT id, title, description, created_at, updated_at
      FROM core.job_titles
      WHERE organization_id = $1
      ORDER BY title`,
      [organizationId]
    );
    
    res.status(200).json({
      jobTitles: result.rows
    });
  } catch (error) {
    console.error('Get job titles error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get job title by ID
 */
const getJobTitleById = async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pgPool.query(
      `SELECT id, organization_id, title, description, created_at, updated_at
      FROM core.job_titles
      WHERE id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job title not found' });
    }
    
    // Get employees with this job title
    const employeesResult = await pgPool.query(
      `SELECT id, employee_id, first_name, last_name, department_id, 
      (SELECT name FROM core.departments WHERE id = department_id) as department
      FROM hr.employees
      WHERE job_title_id = $1
      ORDER BY first_name, last_name`,
      [id]
    );
    
    const jobTitle = {
      ...result.rows[0],
      employees: employeesResult.rows
    };
    
    res.status(200).json({
      jobTitle
    });
  } catch (error) {
    console.error('Get job title error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Create new job title
 */
const createJobTitle = async (req, res) => {
  const { organization_id, title, description } = req.body;
  
  if (!organization_id || !title) {
    return res.status(400).json({ error: 'Organization ID and title are required' });
  }
  
  try {
    // Check if job title with same name already exists in the organization
    const titleCheck = await pgPool.query(
      'SELECT id FROM core.job_titles WHERE title = $1 AND organization_id = $2',
      [title, organization_id]
    );
    
    if (titleCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Job title already exists in the organization' });
    }
    
    const result = await pgPool.query(
      `INSERT INTO core.job_titles 
      (organization_id, title, description, created_at, updated_at) 
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
      RETURNING id, organization_id, title, description, created_at`,
      [organization_id, title, description]
    );
    
    res.status(201).json({
      message: 'Job title created successfully',
      jobTitle: result.rows[0]
    });
  } catch (error) {
    console.error('Create job title error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update job title
 */
const updateJobTitle = async (req, res) => {
  const { id } = req.params;
  const { title, description } = req.body;
  
  try {
    // Check if job title exists
    const titleCheck = await pgPool.query(
      'SELECT id, organization_id FROM core.job_titles WHERE id = $1',
      [id]
    );
    
    if (titleCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Job title not found' });
    }
    
    const organization_id = titleCheck.rows[0].organization_id;
    
    // Check if new title already exists in the organization
    if (title) {
      const duplicateCheck = await pgPool.query(
        'SELECT id FROM core.job_titles WHERE title = $1 AND organization_id = $2 AND id != $3',
        [title, organization_id, id]
      );
      
      if (duplicateCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Job title already exists in the organization' });
      }
    }
    
    const result = await pgPool.query(
      `UPDATE core.job_titles 
      SET title = COALESCE($1, title), 
          description = COALESCE($2, description),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING id, organization_id, title, description, created_at, updated_at`,
      [title, description, id]
    );
    
    res.status(200).json({
      message: 'Job title updated successfully',
      jobTitle: result.rows[0]
    });
  } catch (error) {
    console.error('Update job title error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Delete job title
 */
const deleteJobTitle = async (req, res) => {
  const { id } = req.params;
  
  try {
    // Check if job title exists
    const titleCheck = await pgPool.query(
      'SELECT id FROM core.job_titles WHERE id = $1',
      [id]
    );
    
    if (titleCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Job title not found' });
    }
    
    // Check if job title has employees
    const empCheck = await pgPool.query(
      'SELECT id FROM hr.employees WHERE job_title_id = $1 LIMIT 1',
      [id]
    );
    
    if (empCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Cannot delete job title with assigned employees' });
    }
    
    await pgPool.query(
      'DELETE FROM core.job_titles WHERE id = $1',
      [id]
    );
    
    res.status(200).json({
      message: 'Job title deleted successfully'
    });
  } catch (error) {
    console.error('Delete job title error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getJobTitles,
  getJobTitleById,
  createJobTitle,
  updateJobTitle,
  deleteJobTitle
};
