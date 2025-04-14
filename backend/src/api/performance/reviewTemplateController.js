// Review Template Controller for People X
const { pgPool } = require('../../config/database');

/**
 * Get all review templates for an organization
 */
const getReviewTemplates = async (req, res) => {
  const { organizationId } = req.query;
  
  if (!organizationId) {
    return res.status(400).json({ error: 'Organization ID is required' });
  }
  
  try {
    const result = await pgPool.query(
      `SELECT id, name, description, is_active, created_at, updated_at
      FROM performance.review_templates
      WHERE organization_id = $1
      ORDER BY name`,
      [organizationId]
    );
    
    res.status(200).json({
      reviewTemplates: result.rows
    });
  } catch (error) {
    console.error('Get review templates error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get review template by ID
 */
const getReviewTemplateById = async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pgPool.query(
      `SELECT id, organization_id, name, description, is_active, created_at, updated_at
      FROM performance.review_templates
      WHERE id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Review template not found' });
    }
    
    // Get template questions
    const questionsResult = await pgPool.query(
      `SELECT id, category, question, description, weight, type, options
      FROM performance.review_questions
      WHERE template_id = $1
      ORDER BY category, id`,
      [id]
    );
    
    const template = {
      ...result.rows[0],
      questions: questionsResult.rows
    };
    
    res.status(200).json({
      reviewTemplate: template
    });
  } catch (error) {
    console.error('Get review template error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Create new review template
 */
const createReviewTemplate = async (req, res) => {
  const { 
    organization_id, name, description, is_active
  } = req.body;
  
  if (!organization_id || !name) {
    return res.status(400).json({ error: 'Organization ID and name are required' });
  }
  
  try {
    const result = await pgPool.query(
      `INSERT INTO performance.review_templates 
      (organization_id, name, description, is_active, created_at, updated_at) 
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
      RETURNING id, name, description, is_active, created_at`,
      [
        organization_id, name, description, is_active !== undefined ? is_active : true
      ]
    );
    
    res.status(201).json({
      message: 'Review template created successfully',
      reviewTemplate: result.rows[0]
    });
  } catch (error) {
    console.error('Create review template error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update review template
 */
const updateReviewTemplate = async (req, res) => {
  const { id } = req.params;
  const { 
    name, description, is_active
  } = req.body;
  
  try {
    // Check if template exists
    const templateCheck = await pgPool.query(
      'SELECT id FROM performance.review_templates WHERE id = $1',
      [id]
    );
    
    if (templateCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Review template not found' });
    }
    
    const result = await pgPool.query(
      `UPDATE performance.review_templates 
      SET name = COALESCE($1, name), 
          description = $2, 
          is_active = COALESCE($3, is_active), 
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING id, name, description, is_active, updated_at`,
      [
        name, description, is_active, id
      ]
    );
    
    res.status(200).json({
      message: 'Review template updated successfully',
      reviewTemplate: result.rows[0]
    });
  } catch (error) {
    console.error('Update review template error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Add question to template
 */
const addQuestion = async (req, res) => {
  const { template_id } = req.params;
  const { 
    category, question, description, weight, type, options
  } = req.body;
  
  if (!category || !question || !weight || !type) {
    return res.status(400).json({ error: 'Category, question, weight, and type are required' });
  }
  
  try {
    // Check if template exists
    const templateCheck = await pgPool.query(
      'SELECT id FROM performance.review_templates WHERE id = $1',
      [template_id]
    );
    
    if (templateCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Review template not found' });
    }
    
    const result = await pgPool.query(
      `INSERT INTO performance.review_questions 
      (template_id, category, question, description, weight, type, options, created_at, updated_at) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
      RETURNING id, category, question, weight, type`,
      [
        template_id, category, question, description, weight, type, options
      ]
    );
    
    res.status(201).json({
      message: 'Question added successfully',
      question: result.rows[0]
    });
  } catch (error) {
    console.error('Add question error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update question
 */
const updateQuestion = async (req, res) => {
  const { question_id } = req.params;
  const { 
    category, question, description, weight, type, options
  } = req.body;
  
  try {
    // Check if question exists
    const questionCheck = await pgPool.query(
      'SELECT id FROM performance.review_questions WHERE id = $1',
      [question_id]
    );
    
    if (questionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }
    
    const result = await pgPool.query(
      `UPDATE performance.review_questions 
      SET category = COALESCE($1, category), 
          question = COALESCE($2, question), 
          description = $3, 
          weight = COALESCE($4, weight),
          type = COALESCE($5, type),
          options = $6,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING id, category, question, weight, type`,
      [
        category, question, description, weight, type, options, question_id
      ]
    );
    
    res.status(200).json({
      message: 'Question updated successfully',
      question: result.rows[0]
    });
  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Delete question
 */
const deleteQuestion = async (req, res) => {
  const { question_id } = req.params;
  
  try {
    // Check if question exists
    const questionCheck = await pgPool.query(
      'SELECT id FROM performance.review_questions WHERE id = $1',
      [question_id]
    );
    
    if (questionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }
    
    // Check if question is used in any reviews
    const usageCheck = await pgPool.query(
      'SELECT id FROM performance.review_answers WHERE question_id = $1 LIMIT 1',
      [question_id]
    );
    
    if (usageCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Cannot delete question that is used in reviews' });
    }
    
    await pgPool.query(
      'DELETE FROM performance.review_questions WHERE id = $1',
      [question_id]
    );
    
    res.status(200).json({
      message: 'Question deleted successfully'
    });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Delete review template
 */
const deleteReviewTemplate = async (req, res) => {
  const { id } = req.params;
  
  try {
    // Check if template exists
    const templateCheck = await pgPool.query(
      'SELECT id FROM performance.review_templates WHERE id = $1',
      [id]
    );
    
    if (templateCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Review template not found' });
    }
    
    // Check if template is used in any review cycles
    const cycleCheck = await pgPool.query(
      'SELECT id FROM performance.review_cycles WHERE review_template_id = $1 LIMIT 1',
      [id]
    );
    
    if (cycleCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Cannot delete template that is used in review cycles' });
    }
    
    // Delete template questions
    await pgPool.query(
      'DELETE FROM performance.review_questions WHERE template_id = $1',
      [id]
    );
    
    // Delete template
    await pgPool.query(
      'DELETE FROM performance.review_templates WHERE id = $1',
      [id]
    );
    
    res.status(200).json({
      message: 'Review template deleted successfully'
    });
  } catch (error) {
    console.error('Delete review template error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getReviewTemplates,
  getReviewTemplateById,
  createReviewTemplate,
  updateReviewTemplate,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  deleteReviewTemplate
};
