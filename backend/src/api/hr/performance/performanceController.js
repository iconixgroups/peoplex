const { pgPool } = require('../../../config/database');

// Performance Review Cycles
const getReviewCycles = async (req, res) => {
  try {
    const { organization_id, status } = req.query;
    const query = `
      SELECT 
        rc.*,
        COUNT(pr.id) as review_count,
        AVG(pr.overall_rating) as average_rating
      FROM hr.performance_review_cycles rc
      LEFT JOIN hr.performance_reviews pr ON pr.cycle_id = rc.id
      WHERE rc.organization_id = $1
      ${status ? 'AND rc.status = $2' : ''}
      GROUP BY rc.id
      ORDER BY rc.start_date DESC
    `;
    const values = status ? [organization_id, status] : [organization_id];
    const result = await pgPool.query(query, values);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching review cycles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createReviewCycle = async (req, res) => {
  try {
    const {
      organization_id,
      name,
      description,
      start_date,
      end_date,
      status = 'draft'
    } = req.body;

    const query = `
      INSERT INTO hr.performance_review_cycles 
        (organization_id, name, description, start_date, end_date, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [organization_id, name, description, start_date, end_date, status];
    const result = await pgPool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating review cycle:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Performance Reviews
const getPerformanceReviews = async (req, res) => {
  try {
    const { organization_id, employee_id, status } = req.query;
    let query = `
      SELECT pr.*, 
             e.first_name as employee_first_name,
             e.last_name as employee_last_name,
             r.first_name as reviewer_first_name,
             r.last_name as reviewer_last_name,
             d.name as department_name
      FROM performance_reviews pr
      JOIN employees e ON pr.employee_id = e.id
      JOIN employees r ON pr.reviewer_id = r.id
      JOIN departments d ON e.department_id = d.id
      WHERE pr.organization_id = $1
    `;
    const params = [organization_id];
    let paramCount = 2;

    if (employee_id) {
      query += ` AND pr.employee_id = $${paramCount}`;
      params.push(employee_id);
      paramCount++;
    }

    if (status) {
      query += ` AND pr.status = $${paramCount}`;
      params.push(status);
    }

    query += ' ORDER BY pr.review_date DESC';

    const result = await pgPool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching performance reviews:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createPerformanceReview = async (req, res) => {
  try {
    const {
      organization_id,
      employee_id,
      reviewer_id,
      review_date,
      performance_rating,
      strengths,
      areas_for_improvement,
      goals,
      status
    } = req.body;

    const query = `
      INSERT INTO performance_reviews (
        organization_id,
        employee_id,
        reviewer_id,
        review_date,
        performance_rating,
        strengths,
        areas_for_improvement,
        goals,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const result = await pgPool.query(query, [
      organization_id,
      employee_id,
      reviewer_id,
      review_date,
      performance_rating,
      strengths,
      areas_for_improvement,
      goals,
      status
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating performance review:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Goals
const getGoals = async (req, res) => {
  try {
    const { organization_id, employee_id, status } = req.query;
    let query = `
      SELECT g.*, 
             e.first_name as employee_first_name,
             e.last_name as employee_last_name,
             d.name as department_name
      FROM goals g
      JOIN employees e ON g.employee_id = e.id
      JOIN departments d ON e.department_id = d.id
      WHERE g.organization_id = $1
    `;
    const params = [organization_id];
    let paramCount = 2;

    if (employee_id) {
      query += ` AND g.employee_id = $${paramCount}`;
      params.push(employee_id);
      paramCount++;
    }

    if (status) {
      query += ` AND g.status = $${paramCount}`;
      params.push(status);
    }

    query += ' ORDER BY g.due_date DESC';

    const result = await pgPool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching goals:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createGoal = async (req, res) => {
  try {
    const {
      organization_id,
      employee_id,
      title,
      description,
      due_date,
      priority,
      status
    } = req.body;

    const query = `
      INSERT INTO goals (
        organization_id,
        employee_id,
        title,
        description,
        due_date,
        priority,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const result = await pgPool.query(query, [
      organization_id,
      employee_id,
      title,
      description,
      due_date,
      priority,
      status
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating goal:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Competencies
const getCompetencies = async (req, res) => {
  try {
    const { organization_id, employee_id } = req.query;
    let query = `
      SELECT c.*, 
             e.first_name as employee_first_name,
             e.last_name as employee_last_name,
             d.name as department_name
      FROM competencies c
      JOIN employees e ON c.employee_id = e.id
      JOIN departments d ON e.department_id = d.id
      WHERE c.organization_id = $1
    `;
    const params = [organization_id];
    let paramCount = 2;

    if (employee_id) {
      query += ` AND c.employee_id = $${paramCount}`;
      params.push(employee_id);
    }

    query += ' ORDER BY c.name';

    const result = await pgPool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching competencies:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createCompetency = async (req, res) => {
  try {
    const {
      organization_id,
      employee_id,
      name,
      description,
      level,
      assessment_date
    } = req.body;

    const query = `
      INSERT INTO competencies (
        organization_id,
        employee_id,
        name,
        description,
        level,
        assessment_date
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const result = await pgPool.query(query, [
      organization_id,
      employee_id,
      name,
      description,
      level,
      assessment_date
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating competency:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Competency Assessments
const getCompetencyAssessments = async (req, res) => {
  try {
    const { organization_id, employee_id, competency_id } = req.query;
    
    let query = `
      SELECT 
        ca.*,
        e.first_name as employee_first_name,
        e.last_name as employee_last_name,
        c.name as competency_name,
        c.category as competency_category
      FROM competency_assessments ca
      JOIN employees e ON ca.employee_id = e.id
      JOIN competencies c ON ca.competency_id = c.id
      WHERE ca.organization_id = $1
    `;
    
    const params = [organization_id];
    let paramCount = 2;
    
    if (employee_id) {
      query += ` AND ca.employee_id = $${paramCount}`;
      params.push(employee_id);
      paramCount++;
    }
    
    if (competency_id) {
      query += ` AND ca.competency_id = $${paramCount}`;
      params.push(competency_id);
    }
    
    query += ' ORDER BY ca.assessment_date DESC';
    
    const result = await pgPool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching competency assessments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createCompetencyAssessment = async (req, res) => {
  try {
    const {
      organization_id,
      employee_id,
      competency_id,
      assessment_date,
      rating,
      comments
    } = req.body;
    
    const query = `
      INSERT INTO competency_assessments (
        organization_id,
        employee_id,
        competency_id,
        assessment_date,
        rating,
        comments
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const result = await pgPool.query(query, [
      organization_id,
      employee_id,
      competency_id,
      assessment_date,
      rating,
      comments
    ]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating competency assessment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  // Review Cycles
  getReviewCycles,
  createReviewCycle,
  
  // Performance Reviews
  getPerformanceReviews,
  createPerformanceReview,
  
  // Goals
  getGoals,
  createGoal,
  
  // Competencies
  getCompetencies,
  createCompetency,
  
  // Competency Assessments
  getCompetencyAssessments,
  createCompetencyAssessment
}; 