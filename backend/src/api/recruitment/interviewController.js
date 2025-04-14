// Interview Controller for People X
const { pgPool } = require('../../config/database');

/**
 * Get all interviews for an application
 */
const getInterviewsByApplication = async (req, res) => {
  const { application_id } = req.params;
  
  try {
    const result = await pgPool.query(
      `SELECT i.id, i.application_id, i.interview_date, i.interview_type, i.status,
      i.location, i.meeting_link, i.feedback, i.rating, i.notes,
      i.interviewer_id, CONCAT(e.first_name, ' ', e.last_name) as interviewer_name,
      i.created_at, i.updated_at
      FROM recruitment.interviews i
      LEFT JOIN hr.employees e ON i.interviewer_id = e.id
      WHERE i.application_id = $1
      ORDER BY i.interview_date`,
      [application_id]
    );
    
    res.status(200).json({
      interviews: result.rows
    });
  } catch (error) {
    console.error('Get interviews error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get interviews by interviewer
 */
const getInterviewsByInterviewer = async (req, res) => {
  const { interviewer_id } = req.params;
  const { status, start_date, end_date } = req.query;
  
  try {
    let query = `
      SELECT i.id, i.application_id, i.interview_date, i.interview_type, i.status,
      i.location, i.meeting_link, i.feedback, i.rating,
      a.candidate_id, a.job_posting_id,
      c.first_name as candidate_first_name, c.last_name as candidate_last_name,
      j.title as job_title
      FROM recruitment.interviews i
      JOIN recruitment.applications a ON i.application_id = a.id
      JOIN recruitment.candidates c ON a.candidate_id = c.id
      JOIN recruitment.job_postings j ON a.job_posting_id = j.id
      WHERE i.interviewer_id = $1
    `;
    
    const queryParams = [interviewer_id];
    let paramIndex = 2;
    
    if (status) {
      query += ` AND i.status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }
    
    if (start_date) {
      query += ` AND i.interview_date >= $${paramIndex}`;
      queryParams.push(start_date);
      paramIndex++;
    }
    
    if (end_date) {
      query += ` AND i.interview_date <= $${paramIndex}`;
      queryParams.push(end_date);
      paramIndex++;
    }
    
    query += ` ORDER BY i.interview_date`;
    
    const result = await pgPool.query(query, queryParams);
    
    res.status(200).json({
      interviews: result.rows
    });
  } catch (error) {
    console.error('Get interviews error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get interview by ID
 */
const getInterviewById = async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pgPool.query(
      `SELECT i.*, 
      CONCAT(e.first_name, ' ', e.last_name) as interviewer_name,
      a.candidate_id, a.job_posting_id,
      c.first_name as candidate_first_name, c.last_name as candidate_last_name, c.email as candidate_email,
      j.title as job_title, j.department_id, j.location_id,
      d.name as department_name, l.name as job_location_name
      FROM recruitment.interviews i
      JOIN recruitment.applications a ON i.application_id = a.id
      JOIN recruitment.candidates c ON a.candidate_id = c.id
      JOIN recruitment.job_postings j ON a.job_posting_id = j.id
      LEFT JOIN hr.employees e ON i.interviewer_id = e.id
      LEFT JOIN core.departments d ON j.department_id = d.id
      LEFT JOIN core.locations l ON j.location_id = l.id
      WHERE i.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Interview not found' });
    }
    
    res.status(200).json({
      interview: result.rows[0]
    });
  } catch (error) {
    console.error('Get interview error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Schedule new interview
 */
const scheduleInterview = async (req, res) => {
  const { 
    application_id, interview_date, interview_type, interviewer_id,
    location, meeting_link, notes
  } = req.body;
  
  if (!application_id || !interview_date || !interview_type || !interviewer_id) {
    return res.status(400).json({ error: 'Application ID, interview date, interview type, and interviewer ID are required' });
  }
  
  try {
    // Check if application exists
    const appCheck = await pgPool.query(
      'SELECT id, status FROM recruitment.applications WHERE id = $1',
      [application_id]
    );
    
    if (appCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    if (!['new', 'screening', 'interview'].includes(appCheck.rows[0].status)) {
      return res.status(400).json({ error: 'Application is not in a valid state for scheduling interviews' });
    }
    
    // Check if interviewer exists
    const interviewerCheck = await pgPool.query(
      'SELECT id FROM hr.employees WHERE id = $1',
      [interviewer_id]
    );
    
    if (interviewerCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Interviewer not found' });
    }
    
    const result = await pgPool.query(
      `INSERT INTO recruitment.interviews 
      (application_id, interview_date, interview_type, status, interviewer_id,
      location, meeting_link, notes, created_by, created_at, updated_at) 
      VALUES ($1, $2, $3, 'scheduled', $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
      RETURNING id, application_id, interview_date, interview_type, status, interviewer_id`,
      [
        application_id, interview_date, interview_type, interviewer_id,
        location, meeting_link, notes, req.user.id
      ]
    );
    
    // Update application status if it's the first interview
    const interviewCount = await pgPool.query(
      'SELECT COUNT(*) FROM recruitment.interviews WHERE application_id = $1',
      [application_id]
    );
    
    if (parseInt(interviewCount.rows[0].count) === 1) {
      await pgPool.query(
        `UPDATE recruitment.applications 
        SET status = 'interview', 
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1`,
        [application_id]
      );
    }
    
    res.status(201).json({
      message: 'Interview scheduled successfully',
      interview: result.rows[0]
    });
  } catch (error) {
    console.error('Schedule interview error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update interview
 */
const updateInterview = async (req, res) => {
  const { id } = req.params;
  const { 
    interview_date, interview_type, status, interviewer_id,
    location, meeting_link, feedback, rating, notes
  } = req.body;
  
  try {
    // Check if interview exists
    const interviewCheck = await pgPool.query(
      'SELECT id FROM recruitment.interviews WHERE id = $1',
      [id]
    );
    
    if (interviewCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Interview not found' });
    }
    
    // Check if interviewer exists if provided
    if (interviewer_id) {
      const interviewerCheck = await pgPool.query(
        'SELECT id FROM hr.employees WHERE id = $1',
        [interviewer_id]
      );
      
      if (interviewerCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Interviewer not found' });
      }
    }
    
    const result = await pgPool.query(
      `UPDATE recruitment.interviews 
      SET interview_date = COALESCE($1, interview_date), 
          interview_type = COALESCE($2, interview_type), 
          status = COALESCE($3, status), 
          interviewer_id = $4,
          location = $5,
          meeting_link = $6,
          feedback = $7,
          rating = $8,
          notes = $9,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $10
      RETURNING id, application_id, interview_date, interview_type, status, interviewer_id, feedback, rating`,
      [
        interview_date, interview_type, status, interviewer_id,
        location, meeting_link, feedback, rating, notes, id
      ]
    );
    
    // If interview is completed, check if we need to update application status
    if (status === 'completed') {
      // Get application ID
      const appResult = await pgPool.query(
        'SELECT application_id FROM recruitment.interviews WHERE id = $1',
        [id]
      );
      
      const application_id = appResult.rows[0].application_id;
      
      // Check if all interviews are completed
      const pendingInterviews = await pgPool.query(
        `SELECT COUNT(*) FROM recruitment.interviews 
        WHERE application_id = $1 AND status IN ('scheduled', 'in_progress')`,
        [application_id]
      );
      
      if (parseInt(pendingInterviews.rows[0].count) === 0) {
        // All interviews are completed, update application status
        await pgPool.query(
          `UPDATE recruitment.applications 
          SET status = 'interview_completed', 
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $1`,
          [application_id]
        );
      }
    }
    
    res.status(200).json({
      message: 'Interview updated successfully',
      interview: result.rows[0]
    });
  } catch (error) {
    console.error('Update interview error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Delete interview
 */
const deleteInterview = async (req, res) => {
  const { id } = req.params;
  
  try {
    // Check if interview exists
    const interviewCheck = await pgPool.query(
      'SELECT id, application_id FROM recruitment.interviews WHERE id = $1',
      [id]
    );
    
    if (interviewCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Interview not found' });
    }
    
    const application_id = interviewCheck.rows[0].application_id;
    
    await pgPool.query(
      'DELETE FROM recruitment.interviews WHERE id = $1',
      [id]
    );
    
    // Check if there are any remaining interviews for this application
    const remainingInterviews = await pgPool.query(
      'SELECT COUNT(*) FROM recruitment.interviews WHERE application_id = $1',
      [application_id]
    );
    
    // If no interviews remain, update application status back to 'screening'
    if (parseInt(remainingInterviews.rows[0].count) === 0) {
      await pgPool.query(
        `UPDATE recruitment.applications 
        SET status = 'screening', 
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1`,
        [application_id]
      );
    }
    
    res.status(200).json({
      message: 'Interview deleted successfully'
    });
  } catch (error) {
    console.error('Delete interview error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getInterviewsByApplication,
  getInterviewsByInterviewer,
  getInterviewById,
  scheduleInterview,
  updateInterview,
  deleteInterview
};
