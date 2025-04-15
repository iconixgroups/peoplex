const pool = require('../../../config/database');

// Job Requisitions
const getRequisitions = async (req, res) => {
  try {
    const { organization_id, department_id, status } = req.query;
    let query = `
      SELECT r.*, 
             d.name as department_name,
             jt.title as job_title,
             m.first_name || ' ' || m.last_name as manager_name,
             COUNT(c.id) as candidate_count,
             r.approval_status,
             r.approval_workflow_id,
             r.required_qualifications,
             r.salary_range,
             r.number_of_positions,
             r.employment_type,
             r.location_id,
             r.remote_work_policy
      FROM job_requisitions r
      JOIN departments d ON r.department_id = d.id
      JOIN job_titles jt ON r.job_title_id = jt.id
      JOIN employees m ON r.manager_id = m.id
      LEFT JOIN candidates c ON c.requisition_id = r.id
      WHERE r.organization_id = $1
    `;
    const params = [organization_id];
    let paramCount = 2;

    if (department_id) {
      query += ` AND r.department_id = $${paramCount}`;
      params.push(department_id);
      paramCount++;
    }

    if (status) {
      query += ` AND r.status = $${paramCount}`;
      params.push(status);
    }

    query += ' GROUP BY r.id, d.name, jt.title, m.first_name, m.last_name ORDER BY r.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching job requisitions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getRequisitionById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT r.*, 
        d.name as department_name,
        j.title as job_title,
        CONCAT(m.first_name, ' ', m.last_name) as manager_name,
        (SELECT COUNT(*) FROM hr.candidates WHERE requisition_id = $1) as candidate_count
      FROM hr.requisitions r
      LEFT JOIN core.departments d ON r.department_id = d.id
      LEFT JOIN core.job_titles j ON r.job_title_id = j.id
      LEFT JOIN hr.employees m ON r.manager_id = m.id
      WHERE r.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Requisition not found' });
    }
    
    res.status(200).json({ requisition: result.rows[0] });
  } catch (error) {
    console.error('Get requisition error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createRequisition = async (req, res) => {
  try {
    const {
      organization_id,
      department_id,
      job_title_id,
      manager_id,
      number_of_positions,
      description,
      requirements,
      salary_range,
      employment_type,
      location_id,
      remote_work_policy,
      required_qualifications,
      approval_workflow_id,
      status = 'draft'
    } = req.body;

    const query = `
      INSERT INTO job_requisitions (
        organization_id,
        department_id,
        job_title_id,
        manager_id,
        number_of_positions,
        description,
        requirements,
        salary_range,
        employment_type,
        location_id,
        remote_work_policy,
        required_qualifications,
        approval_workflow_id,
        status,
        approval_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'pending')
      RETURNING *
    `;

    const result = await pool.query(query, [
      organization_id,
      department_id,
      job_title_id,
      manager_id,
      number_of_positions,
      description,
      requirements,
      salary_range,
      employment_type,
      location_id,
      remote_work_policy,
      required_qualifications,
      approval_workflow_id,
      status
    ]);

    // Trigger workflow for approval if configured
    if (approval_workflow_id) {
      await triggerWorkflow(approval_workflow_id, result.rows[0].id);
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating job requisition:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update job requisition
 */
const updateRequisition = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      department_id,
      position_count,
      description,
      requirements,
      status,
      priority,
      hiring_manager_id
    } = req.body;
    
    // Placeholder implementation
    res.status(200).json({
      message: `Update requisition ${id} - Not yet implemented`,
      requisition: {
        id,
        title,
        department_id,
        position_count,
        description,
        requirements,
        status,
        priority,
        hiring_manager_id,
        updated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error updating requisition:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Delete job requisition
 */
const deleteRequisition = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Placeholder implementation
    res.status(200).json({
      message: `Delete requisition ${id} - Not yet implemented`,
      success: true
    });
  } catch (error) {
    console.error('Error deleting requisition:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Candidates
const getCandidates = async (req, res) => {
  try {
    const { organization_id, requisition_id, status } = req.query;
    let query = `
      SELECT c.*, 
             r.title as job_title,
             d.name as department_name,
             m.first_name || ' ' || m.last_name as manager_name,
             c.resume_url,
             c.linkedin_profile,
             c.portfolio_url,
             c.current_company,
             c.current_title,
             c.experience_years,
             c.skills,
             c.education,
             c.references,
             c.interview_status,
             c.assessment_score
      FROM candidates c
      JOIN job_requisitions jr ON c.requisition_id = jr.id
      JOIN job_titles r ON jr.job_title_id = r.id
      JOIN departments d ON jr.department_id = d.id
      JOIN employees m ON jr.manager_id = m.id
      WHERE c.organization_id = $1
    `;
    const params = [organization_id];
    let paramCount = 2;

    if (requisition_id) {
      query += ` AND c.requisition_id = $${paramCount}`;
      params.push(requisition_id);
      paramCount++;
    }

    if (status) {
      query += ` AND c.status = $${paramCount}`;
      params.push(status);
    }

    query += ' ORDER BY c.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching candidates:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getCandidateById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Placeholder implementation
    res.status(200).json({
      message: `Get candidate ${id} - Not yet implemented`,
      candidate: null
    });
  } catch (error) {
    console.error('Error fetching candidate:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createCandidate = async (req, res) => {
  try {
    const {
      organization_id,
      requisition_id,
      first_name,
      last_name,
      email,
      phone,
      resume_url,
      linkedin_profile,
      portfolio_url,
      current_company,
      current_title,
      experience_years,
      skills,
      education,
      references,
      status = 'new'
    } = req.body;

    const query = `
      INSERT INTO candidates (
        organization_id,
        requisition_id,
        first_name,
        last_name,
        email,
        phone,
        resume_url,
        linkedin_profile,
        portfolio_url,
        current_company,
        current_title,
        experience_years,
        skills,
        education,
        references,
        status,
        interview_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'pending')
      RETURNING *
    `;

    const result = await pool.query(query, [
      organization_id,
      requisition_id,
      first_name,
      last_name,
      email,
      phone,
      resume_url,
      linkedin_profile,
      portfolio_url,
      current_company,
      current_title,
      experience_years,
      skills,
      education,
      references,
      status
    ]);

    // Trigger candidate screening workflow
    await triggerCandidateScreening(result.rows[0].id);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating candidate:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateCandidate = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      first_name,
      last_name,
      email,
      phone,
      status,
      assessment_score
    } = req.body;
    
    // Placeholder implementation
    res.status(200).json({
      message: `Update candidate ${id} - Not yet implemented`,
      candidate: {
        id,
        first_name,
        last_name,
        email,
        phone,
        status,
        assessment_score,
        updated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error updating candidate:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteCandidate = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Placeholder implementation
    res.status(200).json({
      message: `Delete candidate ${id} - Not yet implemented`,
      success: true
    });
  } catch (error) {
    console.error('Error deleting candidate:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Interviews
const getInterviews = async (req, res) => {
  try {
    const { organization_id, candidate_id, status } = req.query;
    let query = `
      SELECT i.*, 
             c.first_name || ' ' || c.last_name as candidate_name,
             e.first_name || ' ' || e.last_name as interviewer_name,
             r.title as job_title,
             i.interview_type,
             i.interview_round,
             i.feedback_form_id,
             i.assessment_criteria,
             i.recording_url,
             i.notes,
             i.feedback_status
      FROM interviews i
      JOIN candidates c ON i.candidate_id = c.id
      JOIN employees e ON i.interviewer_id = e.id
      JOIN job_requisitions jr ON c.requisition_id = jr.id
      JOIN job_titles r ON jr.job_title_id = r.id
      WHERE i.organization_id = $1
    `;
    const params = [organization_id];
    let paramCount = 2;

    if (candidate_id) {
      query += ` AND i.candidate_id = $${paramCount}`;
      params.push(candidate_id);
      paramCount++;
    }

    if (status) {
      query += ` AND i.status = $${paramCount}`;
      params.push(status);
    }

    query += ' ORDER BY i.interview_date DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching interviews:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getInterviewById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Placeholder implementation
    res.status(200).json({
      message: `Get interview ${id} - Not yet implemented`,
      interview: null
    });
  } catch (error) {
    console.error('Error fetching interview:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const scheduleInterview = async (req, res) => {
  try {
    const {
      organization_id,
      candidate_id,
      interviewer_id,
      interview_date,
      interview_type,
      interview_round,
      feedback_form_id,
      assessment_criteria,
      status = 'scheduled'
    } = req.body;

    const query = `
      INSERT INTO interviews (
        organization_id,
        candidate_id,
        interviewer_id,
        interview_date,
        interview_type,
        interview_round,
        feedback_form_id,
        assessment_criteria,
        status,
        feedback_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')
      RETURNING *
    `;

    const result = await pool.query(query, [
      organization_id,
      candidate_id,
      interviewer_id,
      interview_date,
      interview_type,
      interview_round,
      feedback_form_id,
      assessment_criteria,
      status
    ]);

    // Send interview invitations
    await sendInterviewInvitations(result.rows[0]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error scheduling interview:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateInterview = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      interview_date,
      interview_time,
      interview_type,
      interviewer_id,
      location,
      status
    } = req.body;
    
    // Placeholder implementation
    res.status(200).json({
      message: `Update interview ${id} - Not yet implemented`,
      interview: {
        id,
        interview_date,
        interview_time,
        interview_type,
        interviewer_id,
        location,
        status,
        updated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error updating interview:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const cancelInterview = async (req, res) => {
  try {
    const { id } = req.params;
    const { cancellation_reason } = req.body;
    
    // Placeholder implementation
    res.status(200).json({
      message: `Cancel interview ${id} - Not yet implemented`,
      interview: {
        id,
        status: 'cancelled',
        cancellation_reason,
        updated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error cancelling interview:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Offers
const getOffers = async (req, res) => {
  try {
    const { organization_id, candidate_id, status } = req.query;
    let query = `
      SELECT o.*, 
             c.first_name || ' ' || c.last_name as candidate_name,
             r.title as job_title,
             d.name as department_name,
             o.salary,
             o.bonus,
             o.equity,
             o.benefits,
             o.start_date,
             o.offer_letter_url,
             o.acceptance_deadline,
             o.negotiation_status
      FROM offers o
      JOIN candidates c ON o.candidate_id = c.id
      JOIN job_requisitions jr ON c.requisition_id = jr.id
      JOIN job_titles r ON jr.job_title_id = r.id
      JOIN departments d ON jr.department_id = d.id
      WHERE o.organization_id = $1
    `;
    const params = [organization_id];
    let paramCount = 2;

    if (candidate_id) {
      query += ` AND o.candidate_id = $${paramCount}`;
      params.push(candidate_id);
      paramCount++;
    }

    if (status) {
      query += ` AND o.status = $${paramCount}`;
      params.push(status);
    }

    query += ' ORDER BY o.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching offers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getOfferById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Placeholder implementation
    res.status(200).json({
      message: `Get offer ${id} - Not yet implemented`,
      offer: null
    });
  } catch (error) {
    console.error('Error fetching offer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createOffer = async (req, res) => {
  try {
    const {
      organization_id,
      candidate_id,
      salary,
      bonus,
      equity,
      benefits,
      start_date,
      acceptance_deadline,
      status = 'pending'
    } = req.body;

    const query = `
      INSERT INTO offers (
        organization_id,
        candidate_id,
        salary,
        bonus,
        equity,
        benefits,
        start_date,
        acceptance_deadline,
        status,
        negotiation_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'initial')
      RETURNING *
    `;

    const result = await pool.query(query, [
      organization_id,
      candidate_id,
      salary,
      bonus,
      equity,
      benefits,
      start_date,
      acceptance_deadline,
      status
    ]);

    // Generate and store offer letter
    const offerLetter = await generateOfferLetter(result.rows[0]);
    await updateOfferLetterUrl(result.rows[0].id, offerLetter.url);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating offer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      salary,
      bonus,
      benefits,
      start_date,
      expiry_date,
      status
    } = req.body;
    
    // Placeholder implementation
    res.status(200).json({
      message: `Update offer ${id} - Not yet implemented`,
      offer: {
        id,
        salary,
        bonus,
        benefits,
        start_date,
        expiry_date,
        status,
        updated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error updating offer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteOffer = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Placeholder implementation
    res.status(200).json({
      message: `Delete offer ${id} - Not yet implemented`,
      success: true
    });
  } catch (error) {
    console.error('Error deleting offer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Onboarding Plans
const getOnboardingPlans = async (req, res) => {
  try {
    const { organization_id, status } = req.query;
    let query = `
      SELECT op.*, 
             c.first_name || ' ' || c.last_name as candidate_name,
             r.title as job_title,
             d.name as department_name,
             op.tasks,
             op.timeline,
             op.resources,
             op.checklist_items,
             op.mentor_id,
             op.buddy_id,
             op.completion_status
      FROM onboarding_plans op
      JOIN candidates c ON op.candidate_id = c.id
      JOIN job_requisitions jr ON c.requisition_id = jr.id
      JOIN job_titles r ON jr.job_title_id = r.id
      JOIN departments d ON jr.department_id = d.id
      WHERE op.organization_id = $1
    `;
    const params = [organization_id];
    let paramCount = 2;

    if (status) {
      query += ` AND op.status = $${paramCount}`;
      params.push(status);
    }

    query += ' ORDER BY op.start_date DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching onboarding plans:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getOnboardingPlanById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Placeholder implementation
    res.status(200).json({
      message: `Get onboarding plan ${id} - Not yet implemented`,
      onboarding_plan: null
    });
  } catch (error) {
    console.error('Error fetching onboarding plan:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createOnboardingPlan = async (req, res) => {
  try {
    const {
      organization_id,
      candidate_id,
      start_date,
      tasks,
      timeline,
      resources,
      checklist_items,
      mentor_id,
      buddy_id,
      status = 'draft'
    } = req.body;

    const query = `
      INSERT INTO onboarding_plans (
        organization_id,
        candidate_id,
        start_date,
        tasks,
        timeline,
        resources,
        checklist_items,
        mentor_id,
        buddy_id,
        status,
        completion_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'not_started')
      RETURNING *
    `;

    const result = await pool.query(query, [
      organization_id,
      candidate_id,
      start_date,
      tasks,
      timeline,
      resources,
      checklist_items,
      mentor_id,
      buddy_id,
      status
    ]);

    // Create onboarding tasks and notifications
    await createOnboardingTasks(result.rows[0]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating onboarding plan:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateOnboardingPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      start_date,
      end_date,
      tasks,
      status
    } = req.body;
    
    // Placeholder implementation
    res.status(200).json({
      message: `Update onboarding plan ${id} - Not yet implemented`,
      onboarding_plan: {
        id,
        start_date,
        end_date,
        tasks,
        status,
        updated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error updating onboarding plan:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteOnboardingPlan = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Placeholder implementation
    res.status(200).json({
      message: `Delete onboarding plan ${id} - Not yet implemented`,
      success: true
    });
  } catch (error) {
    console.error('Error deleting onboarding plan:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Helper functions
const triggerWorkflow = async (workflowId, requisitionId) => {
  // Implementation for triggering approval workflow
};

const triggerCandidateScreening = async (candidateId) => {
  // Implementation for triggering candidate screening
};

const sendInterviewInvitations = async (interview) => {
  // Implementation for sending interview invitations
};

const generateOfferLetter = async (offer) => {
  // Implementation for generating offer letter
};

const updateOfferLetterUrl = async (offerId, url) => {
  // Implementation for updating offer letter URL
};

const createOnboardingTasks = async (onboardingPlan) => {
  // Implementation for creating onboarding tasks
};

module.exports = {
  // Job Requisitions
  getRequisitions,
  getRequisitionById,
  createRequisition,
  updateRequisition,
  deleteRequisition,
  
  // Candidates
  getCandidates,
  getCandidateById,
  createCandidate,
  updateCandidate,
  deleteCandidate,
  
  // Interviews
  getInterviews,
  getInterviewById,
  scheduleInterview,
  updateInterview,
  cancelInterview,
  
  // Offers
  getOffers,
  getOfferById,
  createOffer,
  updateOffer,
  deleteOffer,
  
  // Onboarding Plans
  getOnboardingPlans,
  getOnboardingPlanById,
  createOnboardingPlan,
  updateOnboardingPlan,
  deleteOnboardingPlan
}; 