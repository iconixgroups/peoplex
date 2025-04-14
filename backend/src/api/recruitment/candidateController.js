// Candidate Controller for People X
const { pgPool } = require('../../config/database');

/**
 * Get all candidates for an organization
 */
const getCandidates = async (req, res) => {
  const { organizationId, status, source } = req.query;
  
  if (!organizationId) {
    return res.status(400).json({ error: 'Organization ID is required' });
  }
  
  try {
    let query = `
      SELECT c.id, c.first_name, c.last_name, c.email, c.phone, 
      c.current_position, c.current_company, c.location, c.source,
      c.status, c.created_at,
      (SELECT COUNT(*) FROM recruitment.applications a WHERE a.candidate_id = c.id) as application_count
      FROM recruitment.candidates c
      WHERE c.organization_id = $1
    `;
    
    const queryParams = [organizationId];
    let paramIndex = 2;
    
    if (status) {
      query += ` AND c.status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }
    
    if (source) {
      query += ` AND c.source = $${paramIndex}`;
      queryParams.push(source);
      paramIndex++;
    }
    
    query += ` ORDER BY c.created_at DESC`;
    
    const result = await pgPool.query(query, queryParams);
    
    res.status(200).json({
      candidates: result.rows
    });
  } catch (error) {
    console.error('Get candidates error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get candidate by ID
 */
const getCandidateById = async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pgPool.query(
      `SELECT c.*
      FROM recruitment.candidates c
      WHERE c.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Candidate not found' });
    }
    
    // Get applications for this candidate
    const applicationsResult = await pgPool.query(
      `SELECT a.id, a.job_posting_id, a.application_date, a.status, a.match_percentage,
      j.title as job_title, j.department_id, j.location_id,
      d.name as department_name, l.name as location_name
      FROM recruitment.applications a
      JOIN recruitment.job_postings j ON a.job_posting_id = j.id
      LEFT JOIN core.departments d ON j.department_id = d.id
      LEFT JOIN core.locations l ON j.location_id = l.id
      WHERE a.candidate_id = $1
      ORDER BY a.application_date DESC`,
      [id]
    );
    
    // Get candidate documents
    const documentsResult = await pgPool.query(
      `SELECT id, document_type, document_name, file_path, upload_date
      FROM recruitment.candidate_documents
      WHERE candidate_id = $1
      ORDER BY upload_date DESC`,
      [id]
    );
    
    // Get candidate interviews
    const interviewsResult = await pgPool.query(
      `SELECT i.id, i.application_id, i.interview_date, i.interview_type, i.status,
      i.interviewer_id, CONCAT(e.first_name, ' ', e.last_name) as interviewer_name,
      a.job_posting_id, j.title as job_title
      FROM recruitment.interviews i
      JOIN recruitment.applications a ON i.application_id = a.id
      JOIN recruitment.job_postings j ON a.job_posting_id = j.id
      LEFT JOIN hr.employees e ON i.interviewer_id = e.id
      WHERE a.candidate_id = $1
      ORDER BY i.interview_date DESC`,
      [id]
    );
    
    const candidate = {
      ...result.rows[0],
      applications: applicationsResult.rows,
      documents: documentsResult.rows,
      interviews: interviewsResult.rows
    };
    
    res.status(200).json({
      candidate
    });
  } catch (error) {
    console.error('Get candidate error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Create new candidate
 */
const createCandidate = async (req, res) => {
  const { 
    organization_id, first_name, last_name, email, phone, 
    current_position, current_company, location, source, 
    linkedin_url, portfolio_url, skills, experience, education,
    notes, status
  } = req.body;
  
  if (!organization_id || !first_name || !last_name || !email) {
    return res.status(400).json({ error: 'Organization ID, first name, last name, and email are required' });
  }
  
  try {
    // Check if candidate with same email already exists
    const emailCheck = await pgPool.query(
      'SELECT id FROM recruitment.candidates WHERE email = $1 AND organization_id = $2',
      [email, organization_id]
    );
    
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Candidate with this email already exists' });
    }
    
    const result = await pgPool.query(
      `INSERT INTO recruitment.candidates 
      (organization_id, first_name, last_name, email, phone, 
      current_position, current_company, location, source, 
      linkedin_url, portfolio_url, skills, experience, education,
      notes, status, created_by, created_at, updated_at) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
      RETURNING id, first_name, last_name, email, status, created_at`,
      [
        organization_id, first_name, last_name, email, phone, 
        current_position, current_company, location, source, 
        linkedin_url, portfolio_url, skills, experience, education,
        notes, status || 'new', req.user.id
      ]
    );
    
    res.status(201).json({
      message: 'Candidate created successfully',
      candidate: result.rows[0]
    });
  } catch (error) {
    console.error('Create candidate error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update candidate
 */
const updateCandidate = async (req, res) => {
  const { id } = req.params;
  const { 
    first_name, last_name, email, phone, 
    current_position, current_company, location, source, 
    linkedin_url, portfolio_url, skills, experience, education,
    notes, status
  } = req.body;
  
  try {
    // Check if candidate exists
    const candidateCheck = await pgPool.query(
      'SELECT id, organization_id FROM recruitment.candidates WHERE id = $1',
      [id]
    );
    
    if (candidateCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Candidate not found' });
    }
    
    // Check if email is unique if provided
    if (email) {
      const emailCheck = await pgPool.query(
        'SELECT id FROM recruitment.candidates WHERE email = $1 AND id != $2 AND organization_id = $3',
        [email, id, candidateCheck.rows[0].organization_id]
      );
      
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Candidate with this email already exists' });
      }
    }
    
    const result = await pgPool.query(
      `UPDATE recruitment.candidates 
      SET first_name = COALESCE($1, first_name), 
          last_name = COALESCE($2, last_name), 
          email = COALESCE($3, email), 
          phone = $4,
          current_position = $5,
          current_company = $6,
          location = $7,
          source = COALESCE($8, source),
          linkedin_url = $9,
          portfolio_url = $10,
          skills = $11,
          experience = $12,
          education = $13,
          notes = $14,
          status = COALESCE($15, status),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $16
      RETURNING id, first_name, last_name, email, status, updated_at`,
      [
        first_name, last_name, email, phone, 
        current_position, current_company, location, source, 
        linkedin_url, portfolio_url, skills, experience, education,
        notes, status, id
      ]
    );
    
    res.status(200).json({
      message: 'Candidate updated successfully',
      candidate: result.rows[0]
    });
  } catch (error) {
    console.error('Update candidate error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Upload candidate document
 */
const uploadDocument = async (req, res) => {
  const { candidate_id } = req.params;
  const { document_type, document_name, file_path } = req.body;
  
  if (!document_type || !document_name || !file_path) {
    return res.status(400).json({ error: 'Document type, name, and file path are required' });
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
    
    const result = await pgPool.query(
      `INSERT INTO recruitment.candidate_documents 
      (candidate_id, document_type, document_name, file_path, uploaded_by, upload_date, created_at, updated_at) 
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
      RETURNING id, document_type, document_name, file_path, upload_date`,
      [candidate_id, document_type, document_name, file_path, req.user.id]
    );
    
    res.status(201).json({
      message: 'Document uploaded successfully',
      document: result.rows[0]
    });
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Delete candidate
 */
const deleteCandidate = async (req, res) => {
  const { id } = req.params;
  
  try {
    // Check if candidate exists
    const candidateCheck = await pgPool.query(
      'SELECT id FROM recruitment.candidates WHERE id = $1',
      [id]
    );
    
    if (candidateCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Candidate not found' });
    }
    
    // Check if candidate has applications
    const appCheck = await pgPool.query(
      'SELECT id FROM recruitment.applications WHERE candidate_id = $1 LIMIT 1',
      [id]
    );
    
    if (appCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Cannot delete candidate with existing applications' });
    }
    
    // Delete candidate documents
    await pgPool.query(
      'DELETE FROM recruitment.candidate_documents WHERE candidate_id = $1',
      [id]
    );
    
    // Delete candidate
    await pgPool.query(
      'DELETE FROM recruitment.candidates WHERE id = $1',
      [id]
    );
    
    res.status(200).json({
      message: 'Candidate deleted successfully'
    });
  } catch (error) {
    console.error('Delete candidate error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getCandidates,
  getCandidateById,
  createCandidate,
  updateCandidate,
  uploadDocument,
  deleteCandidate
};
