// Enrollment Controller for People X
const { pgPool } = require('../../config/database');

/**
 * Get all enrollments for a course
 */
const getCourseEnrollments = async (req, res) => {
  const { course_id } = req.params;
  const { status } = req.query;
  
  try {
    let query = `
      SELECT en.id, en.employee_id, en.enrollment_date, en.status, en.completion_date, en.score,
      CONCAT(e.first_name, ' ', e.last_name) as employee_name,
      e.email, e.job_title_id, jt.title as job_title, d.name as department_name
      FROM learning.enrollments en
      JOIN hr.employees e ON en.employee_id = e.id
      LEFT JOIN core.job_titles jt ON e.job_title_id = jt.id
      LEFT JOIN core.departments d ON e.department_id = d.id
      WHERE en.course_id = $1
    `;
    
    const queryParams = [course_id];
    let paramIndex = 2;
    
    if (status) {
      query += ` AND en.status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }
    
    query += ` ORDER BY en.enrollment_date DESC`;
    
    const result = await pgPool.query(query, queryParams);
    
    res.status(200).json({
      enrollments: result.rows
    });
  } catch (error) {
    console.error('Get course enrollments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get all enrollments for an employee
 */
const getEmployeeEnrollments = async (req, res) => {
  const { employee_id } = req.params;
  const { status } = req.query;
  
  try {
    let query = `
      SELECT en.id, en.course_id, en.enrollment_date, en.status, en.completion_date, en.score,
      c.title as course_title, c.category, c.format, c.duration, c.credits, c.is_mandatory,
      CONCAT(e.first_name, ' ', e.last_name) as instructor_name
      FROM learning.enrollments en
      JOIN learning.courses c ON en.course_id = c.id
      LEFT JOIN hr.employees e ON c.instructor_id = e.id
      WHERE en.employee_id = $1
    `;
    
    const queryParams = [employee_id];
    let paramIndex = 2;
    
    if (status) {
      query += ` AND en.status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }
    
    query += ` ORDER BY en.enrollment_date DESC`;
    
    const result = await pgPool.query(query, queryParams);
    
    res.status(200).json({
      enrollments: result.rows
    });
  } catch (error) {
    console.error('Get employee enrollments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get enrollment by ID
 */
const getEnrollmentById = async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pgPool.query(
      `SELECT en.*, 
      c.title as course_title, c.category, c.format, c.duration, c.credits,
      CONCAT(e.first_name, ' ', e.last_name) as employee_name,
      CONCAT(i.first_name, ' ', i.last_name) as instructor_name
      FROM learning.enrollments en
      JOIN learning.courses c ON en.course_id = c.id
      JOIN hr.employees e ON en.employee_id = e.id
      LEFT JOIN hr.employees i ON c.instructor_id = i.id
      WHERE en.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }
    
    // Get module progress
    const progressResult = await pgPool.query(
      `SELECT mp.module_id, mp.status, mp.completion_date, mp.score,
      cm.title as module_title, cm.sequence_order, cm.content_type
      FROM learning.module_progress mp
      JOIN learning.course_modules cm ON mp.module_id = cm.id
      WHERE mp.enrollment_id = $1
      ORDER BY cm.sequence_order`,
      [id]
    );
    
    const enrollment = {
      ...result.rows[0],
      moduleProgress: progressResult.rows
    };
    
    res.status(200).json({
      enrollment
    });
  } catch (error) {
    console.error('Get enrollment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Enroll employee in course
 */
const enrollEmployee = async (req, res) => {
  const { 
    employee_id, course_id, enrollment_date, assigned_by, due_date, notes
  } = req.body;
  
  if (!employee_id || !course_id) {
    return res.status(400).json({ error: 'Employee ID and course ID are required' });
  }
  
  try {
    // Check if employee exists
    const empCheck = await pgPool.query(
      'SELECT id FROM hr.employees WHERE id = $1',
      [employee_id]
    );
    
    if (empCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    // Check if course exists and is active
    const courseCheck = await pgPool.query(
      'SELECT id, status FROM learning.courses WHERE id = $1',
      [course_id]
    );
    
    if (courseCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    if (courseCheck.rows[0].status !== 'active') {
      return res.status(400).json({ error: 'Course is not active' });
    }
    
    // Check if employee is already enrolled in this course
    const enrollmentCheck = await pgPool.query(
      'SELECT id FROM learning.enrollments WHERE employee_id = $1 AND course_id = $2 AND status != $3',
      [employee_id, course_id, 'completed']
    );
    
    if (enrollmentCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Employee is already enrolled in this course' });
    }
    
    // Start a transaction
    const client = await pgPool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Create enrollment
      const enrollmentResult = await client.query(
        `INSERT INTO learning.enrollments 
        (employee_id, course_id, enrollment_date, status, assigned_by, due_date, notes, created_at, updated_at) 
        VALUES ($1, $2, $3, 'enrolled', $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
        RETURNING id, employee_id, course_id, enrollment_date, status, due_date`,
        [
          employee_id, course_id, 
          enrollment_date || new Date(), 
          assigned_by || req.user.id, 
          due_date, notes
        ]
      );
      
      const enrollmentId = enrollmentResult.rows[0].id;
      
      // Get course modules
      const modulesResult = await client.query(
        `SELECT id FROM learning.course_modules WHERE course_id = $1 ORDER BY sequence_order`,
        [course_id]
      );
      
      // Create module progress records for each module
      for (const module of modulesResult.rows) {
        await client.query(
          `INSERT INTO learning.module_progress 
          (enrollment_id, module_id, status, created_at, updated_at) 
          VALUES ($1, $2, 'not_started', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [enrollmentId, module.id]
        );
      }
      
      await client.query('COMMIT');
      
      res.status(201).json({
        message: 'Employee enrolled in course successfully',
        enrollment: enrollmentResult.rows[0]
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Enroll employee error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update enrollment status
 */
const updateEnrollmentStatus = async (req, res) => {
  const { id } = req.params;
  const { status, completion_date, score, feedback } = req.body;
  
  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }
  
  try {
    // Check if enrollment exists
    const enrollmentCheck = await pgPool.query(
      'SELECT id, status FROM learning.enrollments WHERE id = $1',
      [id]
    );
    
    if (enrollmentCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }
    
    // If marking as completed, ensure completion date
    let completionDate = completion_date;
    if (status === 'completed' && !completionDate) {
      completionDate = new Date();
    }
    
    const result = await pgPool.query(
      `UPDATE learning.enrollments 
      SET status = $1, 
          completion_date = $2, 
          score = $3, 
          feedback = $4,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING id, employee_id, course_id, status, completion_date, score`,
      [
        status, completionDate, score, feedback, id
      ]
    );
    
    res.status(200).json({
      message: 'Enrollment status updated successfully',
      enrollment: result.rows[0]
    });
  } catch (error) {
    console.error('Update enrollment status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update module progress
 */
const updateModuleProgress = async (req, res) => {
  const { enrollment_id, module_id } = req.params;
  const { status, completion_date, score, notes } = req.body;
  
  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }
  
  try {
    // Check if module progress exists
    const progressCheck = await pgPool.query(
      'SELECT id FROM learning.module_progress WHERE enrollment_id = $1 AND module_id = $2',
      [enrollment_id, module_id]
    );
    
    if (progressCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Module progress not found' });
    }
    
    // If marking as completed, ensure completion date
    let completionDate = completion_date;
    if (status === 'completed' && !completionDate) {
      completionDate = new Date();
    }
    
    const result = await pgPool.query(
      `UPDATE learning.module_progress 
      SET status = $1, 
          completion_date = $2, 
          score = $3, 
          notes = $4,
          updated_at = CURRENT_TIMESTAMP
      WHERE enrollment_id = $5 AND module_id = $6
      RETURNING id, enrollment_id, module_id, status, completion_date, score`,
      [
        status, completionDate, score, notes, enrollment_id, module_id
      ]
    );
    
    // Check if all modules are completed
    if (status === 'completed') {
      const allModulesResult = await pgPool.query(
        `SELECT 
          (SELECT COUNT(*) FROM learning.module_progress WHERE enrollment_id = $1) as total,
          (SELECT COUNT(*) FROM learning.module_progress WHERE enrollment_id = $1 AND status = 'completed') as completed`,
        [enrollment_id]
      );
      
      const { total, completed } = allModulesResult.rows[0];
      
      if (parseInt(total) === parseInt(completed)) {
        // All modules completed, update enrollment status
        await pgPool.query(
          `UPDATE learning.enrollments 
          SET status = 'completed', 
              completion_date = CURRENT_TIMESTAMP,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $1`,
          [enrollment_id]
        );
      }
    }
    
    res.status(200).json({
      message: 'Module progress updated successfully',
      moduleProgress: result.rows[0]
    });
  } catch (error) {
    console.error('Update module progress error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Cancel enrollment
 */
const cancelEnrollment = async (req, res) => {
  const { id } = req.params;
  const { cancellation_reason } = req.body;
  
  try {
    // Check if enrollment exists
    const enrollmentCheck = await pgPool.query(
      'SELECT id, status FROM learning.enrollments WHERE id = $1',
      [id]
    );
    
    if (enrollmentCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }
    
    if (enrollmentCheck.rows[0].status === 'completed') {
      return res.status(400).json({ error: 'Cannot cancel a completed enrollment' });
    }
    
    const result = await pgPool.query(
      `UPDATE learning.enrollments 
      SET status = 'cancelled', 
          cancellation_reason = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, employee_id, course_id, status`,
      [
        cancellation_reason, id
      ]
    );
    
    res.status(200).json({
      message: 'Enrollment cancelled successfully',
      enrollment: result.rows[0]
    });
  } catch (error) {
    console.error('Cancel enrollment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getCourseEnrollments,
  getEmployeeEnrollments,
  getEnrollmentById,
  enrollEmployee,
  updateEnrollmentStatus,
  updateModuleProgress,
  cancelEnrollment
};
