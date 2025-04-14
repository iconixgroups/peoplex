// Goal Controller for People X
const { pgPool } = require('../../config/database');

/**
 * Get all goals for an employee
 */
const getEmployeeGoals = async (req, res) => {
  const { employee_id } = req.params;
  const { status, year } = req.query;
  
  try {
    let query = `
      SELECT g.id, g.title, g.description, g.start_date, g.due_date, g.status,
      g.category, g.priority, g.progress, g.created_at, g.updated_at,
      CONCAT(e.first_name, ' ', e.last_name) as assigned_by_name
      FROM performance.goals g
      LEFT JOIN hr.employees e ON g.assigned_by = e.id
      WHERE g.employee_id = $1
    `;
    
    const queryParams = [employee_id];
    let paramIndex = 2;
    
    if (status) {
      query += ` AND g.status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }
    
    if (year) {
      query += ` AND EXTRACT(YEAR FROM g.start_date) = $${paramIndex}`;
      queryParams.push(year);
      paramIndex++;
    }
    
    query += ` ORDER BY g.due_date, g.priority DESC`;
    
    const result = await pgPool.query(query, queryParams);
    
    res.status(200).json({
      goals: result.rows
    });
  } catch (error) {
    console.error('Get employee goals error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get all goals assigned by a manager
 */
const getAssignedGoals = async (req, res) => {
  const { manager_id } = req.params;
  const { status } = req.query;
  
  try {
    let query = `
      SELECT g.id, g.employee_id, g.title, g.status, g.due_date, g.progress,
      CONCAT(e.first_name, ' ', e.last_name) as employee_name
      FROM performance.goals g
      JOIN hr.employees e ON g.employee_id = e.id
      WHERE g.assigned_by = $1
    `;
    
    const queryParams = [manager_id];
    let paramIndex = 2;
    
    if (status) {
      query += ` AND g.status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }
    
    query += ` ORDER BY g.due_date, e.first_name, e.last_name`;
    
    const result = await pgPool.query(query, queryParams);
    
    res.status(200).json({
      goals: result.rows
    });
  } catch (error) {
    console.error('Get assigned goals error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get goal by ID
 */
const getGoalById = async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pgPool.query(
      `SELECT g.*, 
      CONCAT(e.first_name, ' ', e.last_name) as employee_name,
      CONCAT(m.first_name, ' ', m.last_name) as assigned_by_name
      FROM performance.goals g
      JOIN hr.employees e ON g.employee_id = e.id
      LEFT JOIN hr.employees m ON g.assigned_by = m.id
      WHERE g.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    
    // Get goal updates
    const updatesResult = await pgPool.query(
      `SELECT id, update_date, progress, status, comment
      FROM performance.goal_updates
      WHERE goal_id = $1
      ORDER BY update_date DESC`,
      [id]
    );
    
    const goal = {
      ...result.rows[0],
      updates: updatesResult.rows
    };
    
    res.status(200).json({
      goal
    });
  } catch (error) {
    console.error('Get goal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Create new goal
 */
const createGoal = async (req, res) => {
  const { 
    employee_id, title, description, start_date, due_date, 
    category, priority, status, progress, align_with_organization
  } = req.body;
  
  if (!employee_id || !title || !start_date || !due_date) {
    return res.status(400).json({ error: 'Employee ID, title, start date, and due date are required' });
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
    
    const result = await pgPool.query(
      `INSERT INTO performance.goals 
      (employee_id, title, description, start_date, due_date, 
      category, priority, status, progress, align_with_organization,
      assigned_by, created_at, updated_at) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
      RETURNING id, title, start_date, due_date, status, progress`,
      [
        employee_id, title, description, start_date, due_date, 
        category, priority || 'medium', status || 'not_started', progress || 0, align_with_organization,
        req.user.id
      ]
    );
    
    res.status(201).json({
      message: 'Goal created successfully',
      goal: result.rows[0]
    });
  } catch (error) {
    console.error('Create goal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update goal
 */
const updateGoal = async (req, res) => {
  const { id } = req.params;
  const { 
    title, description, start_date, due_date, 
    category, priority, status, progress, align_with_organization
  } = req.body;
  
  try {
    // Check if goal exists
    const goalCheck = await pgPool.query(
      'SELECT id, employee_id FROM performance.goals WHERE id = $1',
      [id]
    );
    
    if (goalCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    
    // Check if user is the employee or the manager who assigned the goal
    const isAuthorized = await pgPool.query(
      'SELECT id FROM performance.goals WHERE id = $1 AND (employee_id = $2 OR assigned_by = $2)',
      [id, req.user.id]
    );
    
    if (isAuthorized.rows.length === 0 && !req.user.roles.some(role => ['admin', 'hr_manager'].includes(role))) {
      return res.status(403).json({ error: 'Not authorized to update this goal' });
    }
    
    const result = await pgPool.query(
      `UPDATE performance.goals 
      SET title = COALESCE($1, title), 
          description = $2, 
          start_date = COALESCE($3, start_date), 
          due_date = COALESCE($4, due_date),
          category = $5,
          priority = COALESCE($6, priority),
          status = COALESCE($7, status),
          progress = COALESCE($8, progress),
          align_with_organization = $9,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $10
      RETURNING id, title, start_date, due_date, status, progress`,
      [
        title, description, start_date, due_date, 
        category, priority, status, progress, align_with_organization,
        id
      ]
    );
    
    // Add goal update record if status or progress changed
    if (status || progress) {
      await pgPool.query(
        `INSERT INTO performance.goal_updates 
        (goal_id, update_date, progress, status, comment, updated_by, created_at) 
        VALUES ($1, CURRENT_TIMESTAMP, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
        [id, progress, status, `Goal updated by ${req.user.username}`, req.user.id]
      );
    }
    
    res.status(200).json({
      message: 'Goal updated successfully',
      goal: result.rows[0]
    });
  } catch (error) {
    console.error('Update goal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Add goal update
 */
const addGoalUpdate = async (req, res) => {
  const { goal_id } = req.params;
  const { progress, status, comment } = req.body;
  
  if (!progress && !status && !comment) {
    return res.status(400).json({ error: 'At least one of progress, status, or comment is required' });
  }
  
  try {
    // Check if goal exists
    const goalCheck = await pgPool.query(
      'SELECT id, employee_id FROM performance.goals WHERE id = $1',
      [goal_id]
    );
    
    if (goalCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    
    // Check if user is the employee or the manager who assigned the goal
    const isAuthorized = await pgPool.query(
      'SELECT id FROM performance.goals WHERE id = $1 AND (employee_id = $2 OR assigned_by = $2)',
      [goal_id, req.user.id]
    );
    
    if (isAuthorized.rows.length === 0 && !req.user.roles.some(role => ['admin', 'hr_manager'].includes(role))) {
      return res.status(403).json({ error: 'Not authorized to update this goal' });
    }
    
    // Add goal update
    const updateResult = await pgPool.query(
      `INSERT INTO performance.goal_updates 
      (goal_id, update_date, progress, status, comment, updated_by, created_at) 
      VALUES ($1, CURRENT_TIMESTAMP, $2, $3, $4, $5, CURRENT_TIMESTAMP) 
      RETURNING id, update_date, progress, status, comment`,
      [goal_id, progress, status, comment, req.user.id]
    );
    
    // Update goal status and progress if provided
    if (status || progress !== undefined) {
      const updateFields = [];
      const updateValues = [];
      let valueIndex = 1;
      
      if (status) {
        updateFields.push(`status = $${valueIndex}`);
        updateValues.push(status);
        valueIndex++;
      }
      
      if (progress !== undefined) {
        updateFields.push(`progress = $${valueIndex}`);
        updateValues.push(progress);
        valueIndex++;
      }
      
      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      
      updateValues.push(goal_id);
      
      await pgPool.query(
        `UPDATE performance.goals 
        SET ${updateFields.join(', ')}
        WHERE id = $${valueIndex}`,
        updateValues
      );
    }
    
    res.status(201).json({
      message: 'Goal update added successfully',
      update: updateResult.rows[0]
    });
  } catch (error) {
    console.error('Add goal update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Delete goal
 */
const deleteGoal = async (req, res) => {
  const { id } = req.params;
  
  try {
    // Check if goal exists
    const goalCheck = await pgPool.query(
      'SELECT id FROM performance.goals WHERE id = $1',
      [id]
    );
    
    if (goalCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    
    // Delete goal updates
    await pgPool.query(
      'DELETE FROM performance.goal_updates WHERE goal_id = $1',
      [id]
    );
    
    // Delete goal
    await pgPool.query(
      'DELETE FROM performance.goals WHERE id = $1',
      [id]
    );
    
    res.status(200).json({
      message: 'Goal deleted successfully'
    });
  } catch (error) {
    console.error('Delete goal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getEmployeeGoals,
  getAssignedGoals,
  getGoalById,
  createGoal,
  updateGoal,
  addGoalUpdate,
  deleteGoal
};
