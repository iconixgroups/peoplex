// Application Controller for People X
const { pgPool } = require('../../config/database');

/**
 * Get all applications for a job posting
 */
const getApplicationsByJobPosting = async (req, res) => {
  const { job_posting_id } = req.params;
  const { status } = req.query;
  
  try {
    let query = `
      SELECT a.id, a.candidate_id, a.job_posting_id, a.application_date, a.status, a.match_percentage,
      a.cover_letter, a.referral_source, a.created_at,
      c.first_name, c.last_name, c.email, c.phone, c.current_position, c.current_company,
      j.title as job_title
      FROM recruitment.applications a
      JOIN recruitment.candidates c ON a.candidate_id = c.id
      JOIN recruitment.job_postings j ON a.job_posting_id = j.id
      WHERE a.job_posting_id = $1
    `;
    
    const queryParams = [job_posting_id];
    let paramIndex = 2;
    
    if (status) {
      query += ` AND a.status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }
    
    query += ` ORDER BY a.application_date DESC`;
    
    const result = await pgPool.query(query, queryParams);
    
    res.status(200).json({
      applications: result.rows
    });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get all applications for a candidate
 */
const getApplicationsByCandidate = async (req, res) => {
  const { candidate_id } = req.params;
  
  try {
    const result = await pgPool.query(
      `SELECT a.id, a.candidate_id, a.job_posting_id, a.application_date, a.status, a.match_percentage,
      a.cover_letter, a.referral_source, a.created_at,
      j.title as job_title, j.department_id, j.location_id,
      d.name as department_name, l.name as location_name
      FROM recruitment.applications a
      JOIN recruitment.job_postings j ON a.job_posting_id = j.id
      LEFT JOIN core.departments d ON j.department_id = d.id
      LEFT JOIN core.locations l ON j.location_id = l.id
      WHERE a.candidate_id = $1
      ORDER BY a.application_date DESC`,
      [candidate_id]
    );
    
    res.status(200).json({
      applications: result.rows
    });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get application by ID
 */
const getApplicationById = async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pgPool.query(
      `SELECT a.*, 
      c.first_name, c.last_name, c.email, c.phone, c.current_position, c.current_company,
      j.title as job_title, j.department_id, j.location_id,
      d.name as department_name, l.name as location_name
      FROM recruitment.applications a
      JOIN recruitment.candidates c ON a.candidate_id = c.id
      JOIN recruitment.job_postings j ON a.job_posting_id = j.id
      LEFT JOIN core.departments d ON j.department_id = d.id
      LEFT JOIN core.locations l ON j.location_id = l.id
      WHERE a.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    // Get interviews for this application
    const interviewsResult = await pgPool.query(
      `SELECT i.id, i.interview_date, i.interview_type, i.status, i.feedback, i.rating,
      i.interviewer_id, CONCAT(e.first_name, ' ', e.last_name) as interviewer_name
      FROM recruitment.interviews i
      LEFT JOIN hr.employees e ON i.interviewer_id = e.id
      WHERE i.application_id = $1
      ORDER BY i.interview_date`,
      [id]
    );
    
    const application = {
      ...result.rows[0],
      interviews: interviewsResult.rows
    };
    
    res.status(200).json({
      application
    });
  } catch (error) {
    console.error('Get application error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Create new application
 */
const createApplication = async (req, res) => {
  const { 
    candidate_id, job_posting_id, cover_letter, 
    referral_source, resume_path, match_percentage
  } = req.body;
  
  if (!candidate_id || !job_posting_id) {
    return res.status(400).json({ error: 'Candidate ID and job posting ID are required' });
  }
  
  try {
    // Check if candidate exists
    const candidateCheck = await pgPool.query(
      'SELECT id FROM recruitment.candidates WHERE id = $1',
      [candidate_id]
    );
    
    if (candidateCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Candidate not found' });
    }
    
    // Check if job posting exists
    const jobCheck = await pgPool.query(
      'SELECT id, status FROM recruitment.job_postings WHERE id = $1',
      [job_posting_id]
    );
    
    if (jobCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Job posting not found' });
    }
    
    if (jobCheck.rows[0].status !== 'published') {
      return res.status(400).json({ error: 'Job posting is not active' });
    }
    
    // Check if application already exists
    const appCheck = await pgPool.query(
      'SELECT id FROM recruitment.applications WHERE candidate_id = $1 AND job_posting_id = $2',
      [candidate_id, job_posting_id]
    );
    
    if (appCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Candidate has already applied for this job' });
    }
    
    const result = await pgPool.query(
      `INSERT INTO recruitment.applications 
      (candidate_id, job_posting_id, application_date, status, cover_letter, 
      referral_source, resume_path, match_percentage, created_at, updated_at) 
      VALUES ($1, $2, CURRENT_TIMESTAMP, 'new', $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
      RETURNING id, candidate_id, job_posting_id, application_date, status, match_percentage`,
      [
        candidate_id, job_posting_id, cover_letter, 
        referral_source, resume_path, match_percentage
      ]
    );
    
    res.status(201).json({
      message: 'Application created successfully',
      application: result.rows[0]
    });
  } catch (error) {
    console.error('Create application error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update application status
 */
const updateApplicationStatus = async (req, res) => {
  const { id } = req.params;
  const { status, rejection_reason, notes } = req.body;
  
  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }
  
  try {
    // Check if application exists
    const appCheck = await pgPool.query(
      'SELECT id FROM recruitment.applications WHERE id = $1',
      [id]
    );
    
    if (appCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    const result = await pgPool.query(
      `UPDATE recruitment.applications 
      SET status = $1, 
          rejection_reason = $2,
          notes = $3,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING id, candidate_id, job_posting_id, status, updated_at`,
      [status, rejection_reason, notes, id]
    );
    
    res.status(200).json({
      message: 'Application status updated successfully',
      application: result.rows[0]
    });
  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Delete application
 */
const deleteApplication = async (req, res) => {
  const { id } = req.params;
  
  try {
    // Check if application exists
    const appCheck = await pgPool.query(
      'SELECT id FROM recruitment.applications WHERE id = $1',
      [id]
    );
    
    if (appCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    // Check if application has interviews
    const interviewCheck = await pgPool.query(
      'SELECT id FROM recruitment.interviews WHERE application_id = $1 LIMIT 1',
      [id]
    );
    
    if (interviewCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Cannot delete application with existing interviews' });
    }
    
    await pgPool.query(
      'DELETE FROM recruitment.applications WHERE id = $1',
      [id]
    );
    
    res.status(200).json({
      message: 'Application deleted successfully'
    });
  } catch (error) {
    console.error('Delete application error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getApplicationsByJobPosting,
  getApplicationsByCandidate,
  getApplicationById,
  createApplication,
  updateApplicationStatus,
  deleteApplication
};
