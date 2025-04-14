// Performance Review Controller for People X
const { pgPool } = require('../../config/database');

/**
 * Get all review cycles for an organization
 */
const getReviewCycles = async (req, res) => {
  const { organizationId } = req.query;
  
  if (!organizationId) {
    return res.status(400).json({ error: 'Organization ID is required' });
  }
  
  try {
    const result = await pgPool.query(
      `SELECT id, name, start_date, end_date, status, 
      review_template_id, created_at, updated_at
      FROM performance.review_cycles
      WHERE organization_id = $1
      ORDER BY start_date DESC`,
      [organizationId]
    );
    
    res.status(200).json({
      reviewCycles: result.rows
    });
  } catch (error) {
    console.error('Get review cycles error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get review cycle by ID
 */
const getReviewCycleById = async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pgPool.query(
      `SELECT rc.*, rt.name as template_name
      FROM performance.review_cycles rc
      LEFT JOIN performance.review_templates rt ON rc.review_template_id = rt.id
      WHERE rc.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Review cycle not found' });
    }
    
    // Get reviews for this cycle
    const reviewsResult = await pgPool.query(
      `SELECT r.id, r.employee_id, r.reviewer_id, r.status, r.score, r.submission_date,
      CONCAT(e.first_name, ' ', e.last_name) as employee_name,
      CONCAT(rv.first_name, ' ', rv.last_name) as reviewer_name
      FROM performance.reviews r
      JOIN hr.employees e ON r.employee_id = e.id
      JOIN hr.employees rv ON r.reviewer_id = rv.id
      WHERE r.review_cycle_id = $1
      ORDER BY e.first_name, e.last_name`,
      [id]
    );
    
    const reviewCycle = {
      ...result.rows[0],
      reviews: reviewsResult.rows
    };
    
    res.status(200).json({
      reviewCycle
    });
  } catch (error) {
    console.error('Get review cycle error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Create new review cycle
 */
const createReviewCycle = async (req, res) => {
  const { 
    organization_id, name, start_date, end_date, 
    status, review_template_id, description
  } = req.body;
  
  if (!organization_id || !name || !start_date || !end_date || !review_template_id) {
    return res.status(400).json({ error: 'Organization ID, name, start date, end date, and review template ID are required' });
  }
  
  try {
    // Check if template exists
    const templateCheck = await pgPool.query(
      'SELECT id FROM performance.review_templates WHERE id = $1 AND organization_id = $2',
      [review_template_id, organization_id]
    );
    
    if (templateCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Review template not found' });
    }
    
    const result = await pgPool.query(
      `INSERT INTO performance.review_cycles 
      (organization_id, name, start_date, end_date, status, review_template_id, description, created_at, updated_at) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
      RETURNING id, name, start_date, end_date, status`,
      [
        organization_id, name, start_date, end_date, 
        status || 'draft', review_template_id, description
      ]
    );
    
    res.status(201).json({
      message: 'Review cycle created successfully',
      reviewCycle: result.rows[0]
    });
  } catch (error) {
    console.error('Create review cycle error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update review cycle
 */
const updateReviewCycle = async (req, res) => {
  const { id } = req.params;
  const { 
    name, start_date, end_date, status, 
    review_template_id, description
  } = req.body;
  
  try {
    // Check if review cycle exists
    const cycleCheck = await pgPool.query(
      'SELECT id, organization_id FROM performance.review_cycles WHERE id = $1',
      [id]
    );
    
    if (cycleCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Review cycle not found' });
    }
    
    // Check if template exists if provided
    if (review_template_id) {
      const templateCheck = await pgPool.query(
        'SELECT id FROM performance.review_templates WHERE id = $1 AND organization_id = $2',
        [review_template_id, cycleCheck.rows[0].organization_id]
      );
      
      if (templateCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Review template not found' });
      }
    }
    
    const result = await pgPool.query(
      `UPDATE performance.review_cycles 
      SET name = COALESCE($1, name), 
          start_date = COALESCE($2, start_date), 
          end_date = COALESCE($3, end_date), 
          status = COALESCE($4, status),
          review_template_id = COALESCE($5, review_template_id),
          description = $6,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING id, name, start_date, end_date, status`,
      [
        name, start_date, end_date, status, 
        review_template_id, description, id
      ]
    );
    
    res.status(200).json({
      message: 'Review cycle updated successfully',
      reviewCycle: result.rows[0]
    });
  } catch (error) {
    console.error('Update review cycle error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Launch review cycle
 */
const launchReviewCycle = async (req, res) => {
  const { id } = req.params;
  const { employees, reviewers } = req.body;
  
  if (!employees || !Array.isArray(employees) || employees.length === 0) {
    return res.status(400).json({ error: 'Employees array is required' });
  }
  
  // Start a transaction
  const client = await pgPool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Check if review cycle exists
    const cycleCheck = await client.query(
      'SELECT id, status FROM performance.review_cycles WHERE id = $1',
      [id]
    );
    
    if (cycleCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Review cycle not found' });
    }
    
    if (cycleCheck.rows[0].status !== 'draft') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Review cycle is already launched' });
    }
    
    // Update cycle status
    await client.query(
      `UPDATE performance.review_cycles 
      SET status = 'active', 
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1`,
      [id]
    );
    
    // Create reviews for each employee
    for (const employeeId of employees) {
      // Determine reviewer (manager or specified reviewer)
      let reviewerId;
      
      if (reviewers && reviewers[employeeId]) {
        reviewerId = reviewers[employeeId];
      } else {
        // Get employee's manager
        const managerResult = await client.query(
          'SELECT manager_id FROM hr.employees WHERE id = $1',
          [employeeId]
        );
        
        if (managerResult.rows.length === 0 || !managerResult.rows[0].manager_id) {
          console.warn(`No manager found for employee ${employeeId}, skipping`);
          continue;
        }
        
        reviewerId = managerResult.rows[0].manager_id;
      }
      
      // Create review
      await client.query(
        `INSERT INTO performance.reviews 
        (review_cycle_id, employee_id, reviewer_id, status, created_at, updated_at) 
        VALUES ($1, $2, $3, 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [id, employeeId, reviewerId]
      );
    }
    
    await client.query('COMMIT');
    
    res.status(200).json({
      message: 'Review cycle launched successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Launch review cycle error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

/**
 * Get all reviews for an employee
 */
const getEmployeeReviews = async (req, res) => {
  const { employee_id } = req.params;
  
  try {
    const result = await pgPool.query(
      `SELECT r.id, r.review_cycle_id, r.employee_id, r.reviewer_id, 
      r.status, r.score, r.submission_date, r.created_at,
      rc.name as review_cycle_name, rc.start_date, rc.end_date,
      CONCAT(rv.first_name, ' ', rv.last_name) as reviewer_name
      FROM performance.reviews r
      JOIN performance.review_cycles rc ON r.review_cycle_id = rc.id
      JOIN hr.employees rv ON r.reviewer_id = rv.id
      WHERE r.employee_id = $1
      ORDER BY rc.start_date DESC`,
      [employee_id]
    );
    
    res.status(200).json({
      reviews: result.rows
    });
  } catch (error) {
    console.error('Get employee reviews error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get all reviews to be completed by a reviewer
 */
const getReviewerTasks = async (req, res) => {
  const { reviewer_id } = req.params;
  const { status } = req.query;
  
  try {
    let query = `
      SELECT r.id, r.review_cycle_id, r.employee_id, r.reviewer_id, 
      r.status, r.score, r.submission_date, r.created_at,
      rc.name as review_cycle_name, rc.start_date, rc.end_date,
      CONCAT(e.first_name, ' ', e.last_name) as employee_name,
      e.job_title_id, jt.title as job_title
      FROM performance.reviews r
      JOIN performance.review_cycles rc ON r.review_cycle_id = rc.id
      JOIN hr.employees e ON r.employee_id = e.id
      LEFT JOIN core.job_titles jt ON e.job_title_id = jt.id
      WHERE r.reviewer_id = $1
    `;
    
    const queryParams = [reviewer_id];
    let paramIndex = 2;
    
    if (status) {
      query += ` AND r.status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }
    
    query += ` ORDER BY rc.end_date, e.first_name, e.last_name`;
    
    const result = await pgPool.query(query, queryParams);
    
    res.status(200).json({
      reviews: result.rows
    });
  } catch (error) {
    console.error('Get reviewer tasks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get review by ID
 */
const getReviewById = async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pgPool.query(
      `SELECT r.*, 
      rc.name as review_cycle_name, rc.start_date, rc.end_date, rc.review_template_id,
      rt.name as template_name,
      CONCAT(e.first_name, ' ', e.last_name) as employee_name,
      e.job_title_id, jt.title as job_title,
      CONCAT(rv.first_name, ' ', rv.last_name) as reviewer_name
      FROM performance.reviews r
      JOIN performance.review_cycles rc ON r.review_cycle_id = rc.id
      JOIN performance.review_templates rt ON rc.review_template_id = rt.id
      JOIN hr.employees e ON r.employee_id = e.id
      JOIN hr.employees rv ON r.reviewer_id = rv.id
      LEFT JOIN core.job_titles jt ON e.job_title_id = jt.id
      WHERE r.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    // Get review answers
    const answersResult = await pgPool.query(
      `SELECT ra.id, ra.question_id, ra.rating, ra.comment,
      rq.question, rq.category, rq.weight
      FROM performance.review_answers ra
      JOIN performance.review_questions rq ON ra.question_id = rq.id
      WHERE ra.review_id = $1
      ORDER BY rq.category, rq.id`,
      [id]
    );
    
    const review = {
      ...result.rows[0],
      answers: answersResult.rows
    };
    
    res.status(200).json({
      review
    });
  } catch (error) {
    console.error('Get review error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Submit review
 */
const submitReview = async (req, res) => {
  const { id } = req.params;
  const { answers, overall_comment } = req.body;
  
  if (!answers || !Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({ error: 'Answers array is required' });
  }
  
  // Start a transaction
  const client = await pgPool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Check if review exists
    const reviewCheck = await client.query(
      'SELECT id, status, review_cycle_id FROM performance.reviews WHERE id = $1',
      [id]
    );
    
    if (reviewCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Review not found' });
    }
    
    if (reviewCheck.rows[0].status !== 'pending') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Review is not in pending status' });
    }
    
    // Get review template questions
    const templateResult = await client.query(
      `SELECT rq.id, rq.weight
      FROM performance.review_questions rq
      JOIN performance.review_templates rt ON rq.template_id = rt.id
      JOIN performance.review_cycles rc ON rt.id = rc.review_template_id
      WHERE rc.id = $1`,
      [reviewCheck.rows[0].review_cycle_id]
    );
    
    const questions = templateResult.rows;
    
    // Validate that all required questions are answered
    const questionIds = questions.map(q => q.id);
    const answerQuestionIds = answers.map(a => a.question_id);
    const missingQuestions = questionIds.filter(id => !answerQuestionIds.includes(id));
    
    if (missingQuestions.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `Missing answers for questions: ${missingQuestions.join(', ')}` });
    }
    
    // Save answers
    for (const answer of answers) {
      await client.query(
        `INSERT INTO performance.review_answers 
        (review_id, question_id, rating, comment, created_at, updated_at) 
        VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [id, answer.question_id, answer.rating, answer.comment]
      );
    }
    
    // Calculate weighted average score
    let totalWeight = 0;
    let weightedSum = 0;
    
    for (const answer of answers) {
      const question = questions.find(q => q.id === answer.question_id);
      if (question) {
        totalWeight += parseFloat(question.weight);
        weightedSum += parseFloat(answer.rating) * parseFloat(question.weight);
      }
    }
    
    const score = totalWeight > 0 ? (weightedSum / totalWeight).toFixed(2) : 0;
    
    // Update review
    await client.query(
      `UPDATE performance.reviews 
      SET status = 'completed', 
          score = $1,
          overall_comment = $2,
          submission_date = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3`,
      [score, overall_comment, id]
    );
    
    await client.query('COMMIT');
    
    res.status(200).json({
      message: 'Review submitted successfully',
      score
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Submit review error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

module.exports = {
  getReviewCycles,
  getReviewCycleById,
  createReviewCycle,
  updateReviewCycle,
  launchReviewCycle,
  getEmployeeReviews,
  getReviewerTasks,
  getReviewById,
  submitReview
};
