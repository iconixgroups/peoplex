// Course Controller for People X
const { pgPool } = require('../../config/database');

/**
 * Get all courses for an organization
 */
const getCourses = async (req, res) => {
  const { organizationId, status, category } = req.query;
  
  if (!organizationId) {
    return res.status(400).json({ error: 'Organization ID is required' });
  }
  
  try {
    let query = `
      SELECT c.id, c.title, c.description, c.category, c.format, c.status,
      c.duration, c.credits, c.instructor_id, c.is_mandatory, c.created_at,
      CONCAT(e.first_name, ' ', e.last_name) as instructor_name,
      (SELECT COUNT(*) FROM learning.enrollments en WHERE en.course_id = c.id) as enrollment_count
      FROM learning.courses c
      LEFT JOIN hr.employees e ON c.instructor_id = e.id
      WHERE c.organization_id = $1
    `;
    
    const queryParams = [organizationId];
    let paramIndex = 2;
    
    if (status) {
      query += ` AND c.status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }
    
    if (category) {
      query += ` AND c.category = $${paramIndex}`;
      queryParams.push(category);
      paramIndex++;
    }
    
    query += ` ORDER BY c.created_at DESC`;
    
    const result = await pgPool.query(query, queryParams);
    
    res.status(200).json({
      courses: result.rows
    });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get course by ID
 */
const getCourseById = async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pgPool.query(
      `SELECT c.*, 
      CONCAT(e.first_name, ' ', e.last_name) as instructor_name
      FROM learning.courses c
      LEFT JOIN hr.employees e ON c.instructor_id = e.id
      WHERE c.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    // Get course modules
    const modulesResult = await pgPool.query(
      `SELECT id, title, description, sequence_order, content_type, content_url, duration
      FROM learning.course_modules
      WHERE course_id = $1
      ORDER BY sequence_order`,
      [id]
    );
    
    // Get enrollments
    const enrollmentsResult = await pgPool.query(
      `SELECT en.id, en.employee_id, en.enrollment_date, en.status, en.completion_date, en.score,
      CONCAT(e.first_name, ' ', e.last_name) as employee_name
      FROM learning.enrollments en
      JOIN hr.employees e ON en.employee_id = e.id
      WHERE en.course_id = $1
      ORDER BY en.enrollment_date DESC`,
      [id]
    );
    
    const course = {
      ...result.rows[0],
      modules: modulesResult.rows,
      enrollments: enrollmentsResult.rows
    };
    
    res.status(200).json({
      course
    });
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Create new course
 */
const createCourse = async (req, res) => {
  const { 
    organization_id, title, description, category, format, status,
    duration, credits, instructor_id, is_mandatory, start_date, end_date,
    prerequisites, learning_objectives, target_audience
  } = req.body;
  
  if (!organization_id || !title || !category || !format) {
    return res.status(400).json({ error: 'Organization ID, title, category, and format are required' });
  }
  
  try {
    // Check if instructor exists if provided
    if (instructor_id) {
      const instructorCheck = await pgPool.query(
        'SELECT id FROM hr.employees WHERE id = $1',
        [instructor_id]
      );
      
      if (instructorCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Instructor not found' });
      }
    }
    
    const result = await pgPool.query(
      `INSERT INTO learning.courses 
      (organization_id, title, description, category, format, status,
      duration, credits, instructor_id, is_mandatory, start_date, end_date,
      prerequisites, learning_objectives, target_audience, created_by, created_at, updated_at) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
      RETURNING id, title, category, format, status, created_at`,
      [
        organization_id, title, description, category, format, 
        status || 'draft', duration, credits, instructor_id, 
        is_mandatory || false, start_date, end_date,
        prerequisites, learning_objectives, target_audience, req.user.id
      ]
    );
    
    res.status(201).json({
      message: 'Course created successfully',
      course: result.rows[0]
    });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update course
 */
const updateCourse = async (req, res) => {
  const { id } = req.params;
  const { 
    title, description, category, format, status,
    duration, credits, instructor_id, is_mandatory, start_date, end_date,
    prerequisites, learning_objectives, target_audience
  } = req.body;
  
  try {
    // Check if course exists
    const courseCheck = await pgPool.query(
      'SELECT id FROM learning.courses WHERE id = $1',
      [id]
    );
    
    if (courseCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    // Check if instructor exists if provided
    if (instructor_id) {
      const instructorCheck = await pgPool.query(
        'SELECT id FROM hr.employees WHERE id = $1',
        [instructor_id]
      );
      
      if (instructorCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Instructor not found' });
      }
    }
    
    const result = await pgPool.query(
      `UPDATE learning.courses 
      SET title = COALESCE($1, title), 
          description = $2, 
          category = COALESCE($3, category), 
          format = COALESCE($4, format),
          status = COALESCE($5, status),
          duration = $6,
          credits = $7,
          instructor_id = $8,
          is_mandatory = COALESCE($9, is_mandatory),
          start_date = $10,
          end_date = $11,
          prerequisites = $12,
          learning_objectives = $13,
          target_audience = $14,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $15
      RETURNING id, title, category, format, status, updated_at`,
      [
        title, description, category, format, status,
        duration, credits, instructor_id, is_mandatory, start_date, end_date,
        prerequisites, learning_objectives, target_audience, id
      ]
    );
    
    res.status(200).json({
      message: 'Course updated successfully',
      course: result.rows[0]
    });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Add course module
 */
const addCourseModule = async (req, res) => {
  const { course_id } = req.params;
  const { 
    title, description, sequence_order, content_type, content_url, 
    duration, is_required, passing_score
  } = req.body;
  
  if (!title || !content_type) {
    return res.status(400).json({ error: 'Title and content type are required' });
  }
  
  try {
    // Check if course exists
    const courseCheck = await pgPool.query(
      'SELECT id FROM learning.courses WHERE id = $1',
      [course_id]
    );
    
    if (courseCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    // Get max sequence order if not provided
    let moduleOrder = sequence_order;
    if (!moduleOrder) {
      const orderResult = await pgPool.query(
        'SELECT COALESCE(MAX(sequence_order), 0) + 1 as next_order FROM learning.course_modules WHERE course_id = $1',
        [course_id]
      );
      moduleOrder = orderResult.rows[0].next_order;
    }
    
    const result = await pgPool.query(
      `INSERT INTO learning.course_modules 
      (course_id, title, description, sequence_order, content_type, content_url, 
      duration, is_required, passing_score, created_at, updated_at) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
      RETURNING id, title, sequence_order, content_type, duration`,
      [
        course_id, title, description, moduleOrder, content_type, content_url, 
        duration, is_required || true, passing_score
      ]
    );
    
    res.status(201).json({
      message: 'Course module added successfully',
      module: result.rows[0]
    });
  } catch (error) {
    console.error('Add course module error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update course module
 */
const updateCourseModule = async (req, res) => {
  const { module_id } = req.params;
  const { 
    title, description, sequence_order, content_type, content_url, 
    duration, is_required, passing_score
  } = req.body;
  
  try {
    // Check if module exists
    const moduleCheck = await pgPool.query(
      'SELECT id FROM learning.course_modules WHERE id = $1',
      [module_id]
    );
    
    if (moduleCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Course module not found' });
    }
    
    const result = await pgPool.query(
      `UPDATE learning.course_modules 
      SET title = COALESCE($1, title), 
          description = $2, 
          sequence_order = COALESCE($3, sequence_order), 
          content_type = COALESCE($4, content_type),
          content_url = $5,
          duration = $6,
          is_required = COALESCE($7, is_required),
          passing_score = $8,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING id, title, sequence_order, content_type, duration`,
      [
        title, description, sequence_order, content_type, content_url, 
        duration, is_required, passing_score, module_id
      ]
    );
    
    res.status(200).json({
      message: 'Course module updated successfully',
      module: result.rows[0]
    });
  } catch (error) {
    console.error('Update course module error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Delete course module
 */
const deleteCourseModule = async (req, res) => {
  const { module_id } = req.params;
  
  try {
    // Check if module exists
    const moduleCheck = await pgPool.query(
      'SELECT id FROM learning.course_modules WHERE id = $1',
      [module_id]
    );
    
    if (moduleCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Course module not found' });
    }
    
    await pgPool.query(
      'DELETE FROM learning.course_modules WHERE id = $1',
      [module_id]
    );
    
    res.status(200).json({
      message: 'Course module deleted successfully'
    });
  } catch (error) {
    console.error('Delete course module error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Delete course
 */
const deleteCourse = async (req, res) => {
  const { id } = req.params;
  
  try {
    // Check if course exists
    const courseCheck = await pgPool.query(
      'SELECT id FROM learning.courses WHERE id = $1',
      [id]
    );
    
    if (courseCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    // Check if course has enrollments
    const enrollmentCheck = await pgPool.query(
      'SELECT id FROM learning.enrollments WHERE course_id = $1 LIMIT 1',
      [id]
    );
    
    if (enrollmentCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Cannot delete course with existing enrollments' });
    }
    
    // Delete course modules
    await pgPool.query(
      'DELETE FROM learning.course_modules WHERE course_id = $1',
      [id]
    );
    
    // Delete course
    await pgPool.query(
      'DELETE FROM learning.courses WHERE id = $1',
      [id]
    );
    
    res.status(200).json({
      message: 'Course deleted successfully'
    });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  addCourseModule,
  updateCourseModule,
  deleteCourseModule,
  deleteCourse
};
