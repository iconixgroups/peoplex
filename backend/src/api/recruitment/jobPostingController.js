// Job Posting Controller for People X
const { pgPool } = require('../../config/database');

/**
 * Get all job postings for an organization
 */
const getJobPostings = async (req, res) => {
  const { organizationId, status } = req.query;
  
  if (!organizationId) {
    return res.status(400).json({ error: 'Organization ID is required' });
  }
  
  try {
    let query = `
      SELECT j.id, j.title, j.department_id, d.name as department_name,
      j.location_id, l.name as location_name, j.employment_type,
      j.experience_level, j.education_level, j.salary_min, j.salary_max,
      j.currency, j.is_remote, j.status, j.posting_date, j.closing_date,
      (SELECT COUNT(*) FROM recruitment.applications a WHERE a.job_posting_id = j.id) as application_count
      FROM recruitment.job_postings j
      LEFT JOIN core.departments d ON j.department_id = d.id
      LEFT JOIN core.locations l ON j.location_id = l.id
      WHERE j.organization_id = $1
    `;
    
    const queryParams = [organizationId];
    let paramIndex = 2;
    
    if (status) {
      query += ` AND j.status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }
    
    query += ` ORDER BY j.posting_date DESC`;
    
    const result = await pgPool.query(query, queryParams);
    
    res.status(200).json({
      jobPostings: result.rows
    });
  } catch (error) {
    console.error('Get job postings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get job posting by ID
 */
const getJobPostingById = async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pgPool.query(
      `SELECT j.*, 
      d.name as department_name,
      l.name as location_name,
      CONCAT(e.first_name, ' ', e.last_name) as posted_by_name
      FROM recruitment.job_postings j
      LEFT JOIN core.departments d ON j.department_id = d.id
      LEFT JOIN core.locations l ON j.location_id = l.id
      LEFT JOIN hr.employees e ON j.posted_by = e.user_id
      WHERE j.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job posting not found' });
    }
    
    // Get applications for this job posting
    const applicationsResult = await pgPool.query(
      `SELECT a.id, a.candidate_id, a.application_date, a.status, a.match_percentage,
      c.first_name, c.last_name, c.email, c.phone, c.source
      FROM recruitment.applications a
      JOIN recruitment.candidates c ON a.candidate_id = c.id
      WHERE a.job_posting_id = $1
      ORDER BY a.application_date DESC`,
      [id]
    );
    
    const jobPosting = {
      ...result.rows[0],
      applications: applicationsResult.rows
    };
    
    res.status(200).json({
      jobPosting
    });
  } catch (error) {
    console.error('Get job posting error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Create new job posting
 */
const createJobPosting = async (req, res) => {
  const { 
    organization_id, title, department_id, location_id, job_description,
    requirements, responsibilities, employment_type, experience_level,
    education_level, salary_min, salary_max, currency, is_remote, status,
    posting_date, closing_date
  } = req.body;
  
  if (!organization_id || !title) {
    return res.status(400).json({ error: 'Organization ID and title are required' });
  }
  
  try {
    const result = await pgPool.query(
      `INSERT INTO recruitment.job_postings 
      (organization_id, title, department_id, location_id, job_description,
      requirements, responsibilities, employment_type, experience_level,
      education_level, salary_min, salary_max, currency, is_remote, status,
      posted_by, posting_date, closing_date, created_at, updated_at) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
      RETURNING id, title, status, posting_date, closing_date`,
      [
        organization_id, title, department_id, location_id, job_description,
        requirements, responsibilities, employment_type, experience_level,
        education_level, salary_min, salary_max, currency, is_remote, status || 'draft',
        req.user.id, posting_date, closing_date
      ]
    );
    
    res.status(201).json({
      message: 'Job posting created successfully',
      jobPosting: result.rows[0]
    });
  } catch (error) {
    console.error('Create job posting error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update job posting
 */
const updateJobPosting = async (req, res) => {
  const { id } = req.params;
  const { 
    title, department_id, location_id, job_description,
    requirements, responsibilities, employment_type, experience_level,
    education_level, salary_min, salary_max, currency, is_remote, status,
    posting_date, closing_date
  } = req.body;
  
  try {
    // Check if job posting exists
    const jobCheck = await pgPool.query(
      'SELECT id FROM recruitment.job_postings WHERE id = $1',
      [id]
    );
    
    if (jobCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Job posting not found' });
    }
    
    const result = await pgPool.query(
      `UPDATE recruitment.job_postings 
      SET title = COALESCE($1, title), 
          department_id = $2, 
          location_id = $3, 
          job_description = COALESCE($4, job_description),
          requirements = COALESCE($5, requirements),
          responsibilities = COALESCE($6, responsibilities),
          employment_type = COALESCE($7, employment_type),
          experience_level = COALESCE($8, experience_level),
          education_level = COALESCE($9, education_level),
          salary_min = $10,
          salary_max = $11,
          currency = COALESCE($12, currency),
          is_remote = COALESCE($13, is_remote),
          status = COALESCE($14, status),
          posting_date = $15,
          closing_date = $16,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $17
      RETURNING id, title, status, posting_date, closing_date`,
      [
        title, department_id, location_id, job_description,
        requirements, responsibilities, employment_type, experience_level,
        education_level, salary_min, salary_max, currency, is_remote, status,
        posting_date, closing_date, id
      ]
    );
    
    res.status(200).json({
      message: 'Job posting updated successfully',
      jobPosting: result.rows[0]
    });
  } catch (error) {
    console.error('Update job posting error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Delete job posting
 */
const deleteJobPosting = async (req, res) => {
  const { id } = req.params;
  
  try {
    // Check if job posting exists
    const jobCheck = await pgPool.query(
      'SELECT id FROM recruitment.job_postings WHERE id = $1',
      [id]
    );
    
    if (jobCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Job posting not found' });
    }
    
    // Check if job posting has applications
    const appCheck = await pgPool.query(
      'SELECT id FROM recruitment.applications WHERE job_posting_id = $1 LIMIT 1',
      [id]
    );
    
    if (appCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Cannot delete job posting with existing applications' });
    }
    
    await pgPool.query(
      'DELETE FROM recruitment.job_postings WHERE id = $1',
      [id]
    );
    
    res.status(200).json({
      message: 'Job posting deleted successfully'
    });
  } catch (error) {
    console.error('Delete job posting error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getJobPostings,
  getJobPostingById,
  createJobPosting,
  updateJobPosting,
  deleteJobPosting
};
