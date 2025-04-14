// Salary Controller for People X
const { pgPool } = require('../../config/database');

/**
 * Get salary structures for an organization
 */
const getSalaryStructures = async (req, res) => {
  const { organizationId } = req.query;
  
  if (!organizationId) {
    return res.status(400).json({ error: 'Organization ID is required' });
  }
  
  try {
    const result = await pgPool.query(
      `SELECT id, name, description, is_active, currency, created_at, updated_at
      FROM compensation.salary_structures
      WHERE organization_id = $1
      ORDER BY name`,
      [organizationId]
    );
    
    res.status(200).json({
      salaryStructures: result.rows
    });
  } catch (error) {
    console.error('Get salary structures error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get salary structure by ID
 */
const getSalaryStructureById = async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pgPool.query(
      `SELECT id, organization_id, name, description, is_active, currency, created_at, updated_at
      FROM compensation.salary_structures
      WHERE id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Salary structure not found' });
    }
    
    // Get salary grades for this structure
    const gradesResult = await pgPool.query(
      `SELECT id, grade_code, grade_name, min_salary, mid_salary, max_salary, description
      FROM compensation.salary_grades
      WHERE structure_id = $1
      ORDER BY min_salary`,
      [id]
    );
    
    const salaryStructure = {
      ...result.rows[0],
      grades: gradesResult.rows
    };
    
    res.status(200).json({
      salaryStructure
    });
  } catch (error) {
    console.error('Get salary structure error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Create new salary structure
 */
const createSalaryStructure = async (req, res) => {
  const { 
    organization_id, name, description, is_active, currency
  } = req.body;
  
  if (!organization_id || !name || !currency) {
    return res.status(400).json({ error: 'Organization ID, name, and currency are required' });
  }
  
  try {
    const result = await pgPool.query(
      `INSERT INTO compensation.salary_structures 
      (organization_id, name, description, is_active, currency, created_at, updated_at) 
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
      RETURNING id, name, description, is_active, currency, created_at`,
      [
        organization_id, name, description, is_active !== undefined ? is_active : true, currency
      ]
    );
    
    res.status(201).json({
      message: 'Salary structure created successfully',
      salaryStructure: result.rows[0]
    });
  } catch (error) {
    console.error('Create salary structure error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update salary structure
 */
const updateSalaryStructure = async (req, res) => {
  const { id } = req.params;
  const { 
    name, description, is_active, currency
  } = req.body;
  
  try {
    // Check if structure exists
    const structureCheck = await pgPool.query(
      'SELECT id FROM compensation.salary_structures WHERE id = $1',
      [id]
    );
    
    if (structureCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Salary structure not found' });
    }
    
    const result = await pgPool.query(
      `UPDATE compensation.salary_structures 
      SET name = COALESCE($1, name), 
          description = $2, 
          is_active = COALESCE($3, is_active), 
          currency = COALESCE($4, currency),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING id, name, description, is_active, currency, updated_at`,
      [
        name, description, is_active, currency, id
      ]
    );
    
    res.status(200).json({
      message: 'Salary structure updated successfully',
      salaryStructure: result.rows[0]
    });
  } catch (error) {
    console.error('Update salary structure error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Add salary grade to structure
 */
const addSalaryGrade = async (req, res) => {
  const { structure_id } = req.params;
  const { 
    grade_code, grade_name, min_salary, mid_salary, max_salary, description
  } = req.body;
  
  if (!grade_code || !grade_name || min_salary === undefined || max_salary === undefined) {
    return res.status(400).json({ error: 'Grade code, name, min salary, and max salary are required' });
  }
  
  try {
    // Check if structure exists
    const structureCheck = await pgPool.query(
      'SELECT id FROM compensation.salary_structures WHERE id = $1',
      [structure_id]
    );
    
    if (structureCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Salary structure not found' });
    }
    
    // Check if grade code already exists in this structure
    const gradeCheck = await pgPool.query(
      'SELECT id FROM compensation.salary_grades WHERE structure_id = $1 AND grade_code = $2',
      [structure_id, grade_code]
    );
    
    if (gradeCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Grade code already exists in this structure' });
    }
    
    // Calculate mid salary if not provided
    const calculatedMidSalary = mid_salary !== undefined ? mid_salary : (parseFloat(min_salary) + parseFloat(max_salary)) / 2;
    
    const result = await pgPool.query(
      `INSERT INTO compensation.salary_grades 
      (structure_id, grade_code, grade_name, min_salary, mid_salary, max_salary, description, created_at, updated_at) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
      RETURNING id, grade_code, grade_name, min_salary, mid_salary, max_salary`,
      [
        structure_id, grade_code, grade_name, min_salary, calculatedMidSalary, max_salary, description
      ]
    );
    
    res.status(201).json({
      message: 'Salary grade added successfully',
      salaryGrade: result.rows[0]
    });
  } catch (error) {
    console.error('Add salary grade error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update salary grade
 */
const updateSalaryGrade = async (req, res) => {
  const { grade_id } = req.params;
  const { 
    grade_code, grade_name, min_salary, mid_salary, max_salary, description
  } = req.body;
  
  try {
    // Check if grade exists
    const gradeCheck = await pgPool.query(
      'SELECT id, structure_id FROM compensation.salary_grades WHERE id = $1',
      [grade_id]
    );
    
    if (gradeCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Salary grade not found' });
    }
    
    // Check if grade code already exists in this structure if changing
    if (grade_code) {
      const gradeCodeCheck = await pgPool.query(
        'SELECT id FROM compensation.salary_grades WHERE structure_id = $1 AND grade_code = $2 AND id != $3',
        [gradeCheck.rows[0].structure_id, grade_code, grade_id]
      );
      
      if (gradeCodeCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Grade code already exists in this structure' });
      }
    }
    
    // Calculate mid salary if min and max are provided but mid is not
    let calculatedMidSalary = mid_salary;
    if (min_salary !== undefined && max_salary !== undefined && mid_salary === undefined) {
      calculatedMidSalary = (parseFloat(min_salary) + parseFloat(max_salary)) / 2;
    }
    
    const result = await pgPool.query(
      `UPDATE compensation.salary_grades 
      SET grade_code = COALESCE($1, grade_code), 
          grade_name = COALESCE($2, grade_name), 
          min_salary = COALESCE($3, min_salary), 
          mid_salary = COALESCE($4, mid_salary),
          max_salary = COALESCE($5, max_salary),
          description = $6,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING id, grade_code, grade_name, min_salary, mid_salary, max_salary`,
      [
        grade_code, grade_name, min_salary, calculatedMidSalary, max_salary, description, grade_id
      ]
    );
    
    res.status(200).json({
      message: 'Salary grade updated successfully',
      salaryGrade: result.rows[0]
    });
  } catch (error) {
    console.error('Update salary grade error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Delete salary grade
 */
const deleteSalaryGrade = async (req, res) => {
  const { grade_id } = req.params;
  
  try {
    // Check if grade exists
    const gradeCheck = await pgPool.query(
      'SELECT id FROM compensation.salary_grades WHERE id = $1',
      [grade_id]
    );
    
    if (gradeCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Salary grade not found' });
    }
    
    // Check if grade is used in any employee salaries
    const usageCheck = await pgPool.query(
      'SELECT id FROM compensation.employee_salaries WHERE salary_grade_id = $1 LIMIT 1',
      [grade_id]
    );
    
    if (usageCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Cannot delete grade that is used in employee salaries' });
    }
    
    await pgPool.query(
      'DELETE FROM compensation.salary_grades WHERE id = $1',
      [grade_id]
    );
    
    res.status(200).json({
      message: 'Salary grade deleted successfully'
    });
  } catch (error) {
    console.error('Delete salary grade error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get employee salary history
 */
const getEmployeeSalaryHistory = async (req, res) => {
  const { employee_id } = req.params;
  
  try {
    const result = await pgPool.query(
      `SELECT es.id, es.employee_id, es.effective_date, es.salary_amount, es.currency,
      es.salary_type, es.payment_frequency, es.salary_grade_id, es.reason, es.notes,
      sg.grade_code, sg.grade_name, ss.name as structure_name
      FROM compensation.employee_salaries es
      LEFT JOIN compensation.salary_grades sg ON es.salary_grade_id = sg.id
      LEFT JOIN compensation.salary_structures ss ON sg.structure_id = ss.id
      WHERE es.employee_id = $1
      ORDER BY es.effective_date DESC`,
      [employee_id]
    );
    
    res.status(200).json({
      salaryHistory: result.rows
    });
  } catch (error) {
    console.error('Get employee salary history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Add employee salary record
 */
const addEmployeeSalary = async (req, res) => {
  const { 
    employee_id, effective_date, salary_amount, currency,
    salary_type, payment_frequency, salary_grade_id, reason, notes
  } = req.body;
  
  if (!employee_id || !effective_date || !salary_amount || !currency || !salary_type || !payment_frequency) {
    return res.status(400).json({ error: 'Employee ID, effective date, salary amount, currency, salary type, and payment frequency are required' });
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
    
    // Check if salary grade exists if provided
    if (salary_grade_id) {
      const gradeCheck = await pgPool.query(
        'SELECT id FROM compensation.salary_grades WHERE id = $1',
        [salary_grade_id]
      );
      
      if (gradeCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Salary grade not found' });
      }
    }
    
    const result = await pgPool.query(
      `INSERT INTO compensation.employee_salaries 
      (employee_id, effective_date, salary_amount, currency, salary_type, 
      payment_frequency, salary_grade_id, reason, notes, created_by, created_at, updated_at) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
      RETURNING id, employee_id, effective_date, salary_amount, currency, salary_type, payment_frequency`,
      [
        employee_id, effective_date, salary_amount, currency, salary_type, 
        payment_frequency, salary_grade_id, reason, notes, req.user.id
      ]
    );
    
    res.status(201).json({
      message: 'Employee salary record added successfully',
      salary: result.rows[0]
    });
  } catch (error) {
    console.error('Add employee salary error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Delete employee salary record
 */
const deleteEmployeeSalary = async (req, res) => {
  const { salary_id } = req.params;
  
  try {
    // Check if salary record exists
    const salaryCheck = await pgPool.query(
      'SELECT id FROM compensation.employee_salaries WHERE id = $1',
      [salary_id]
    );
    
    if (salaryCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Salary record not found' });
    }
    
    await pgPool.query(
      'DELETE FROM compensation.employee_salaries WHERE id = $1',
      [salary_id]
    );
    
    res.status(200).json({
      message: 'Salary record deleted successfully'
    });
  } catch (error) {
    console.error('Delete salary record error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getSalaryStructures,
  getSalaryStructureById,
  createSalaryStructure,
  updateSalaryStructure,
  addSalaryGrade,
  updateSalaryGrade,
  deleteSalaryGrade,
  getEmployeeSalaryHistory,
  addEmployeeSalary,
  deleteEmployeeSalary
};
