// Benefits Controller for People X
const { pgPool } = require('../../config/database');

/**
 * Get all benefit plans for an organization
 */
const getBenefitPlans = async (req, res) => {
  const { organizationId } = req.query;
  
  if (!organizationId) {
    return res.status(400).json({ error: 'Organization ID is required' });
  }
  
  try {
    const result = await pgPool.query(
      `SELECT id, name, description, benefit_type, is_active, start_date, end_date, created_at, updated_at
      FROM compensation.benefit_plans
      WHERE organization_id = $1
      ORDER BY name`,
      [organizationId]
    );
    
    res.status(200).json({
      benefitPlans: result.rows
    });
  } catch (error) {
    console.error('Get benefit plans error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get benefit plan by ID
 */
const getBenefitPlanById = async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pgPool.query(
      `SELECT id, organization_id, name, description, benefit_type, is_active, 
      start_date, end_date, provider, policy_number, coverage_details, 
      eligibility_criteria, cost_to_company, cost_to_employee, created_at, updated_at
      FROM compensation.benefit_plans
      WHERE id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Benefit plan not found' });
    }
    
    // Get employees enrolled in this plan
    const enrollmentsResult = await pgPool.query(
      `SELECT eb.id, eb.employee_id, eb.enrollment_date, eb.status,
      CONCAT(e.first_name, ' ', e.last_name) as employee_name
      FROM compensation.employee_benefits eb
      JOIN hr.employees e ON eb.employee_id = e.id
      WHERE eb.benefit_plan_id = $1
      ORDER BY e.first_name, e.last_name`,
      [id]
    );
    
    const benefitPlan = {
      ...result.rows[0],
      enrollments: enrollmentsResult.rows
    };
    
    res.status(200).json({
      benefitPlan
    });
  } catch (error) {
    console.error('Get benefit plan error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Create new benefit plan
 */
const createBenefitPlan = async (req, res) => {
  const { 
    organization_id, name, description, benefit_type, is_active,
    start_date, end_date, provider, policy_number, coverage_details,
    eligibility_criteria, cost_to_company, cost_to_employee
  } = req.body;
  
  if (!organization_id || !name || !benefit_type) {
    return res.status(400).json({ error: 'Organization ID, name, and benefit type are required' });
  }
  
  try {
    const result = await pgPool.query(
      `INSERT INTO compensation.benefit_plans 
      (organization_id, name, description, benefit_type, is_active,
      start_date, end_date, provider, policy_number, coverage_details,
      eligibility_criteria, cost_to_company, cost_to_employee, created_at, updated_at) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
      RETURNING id, name, benefit_type, is_active, start_date, end_date`,
      [
        organization_id, name, description, benefit_type, 
        is_active !== undefined ? is_active : true,
        start_date, end_date, provider, policy_number, coverage_details,
        eligibility_criteria, cost_to_company, cost_to_employee
      ]
    );
    
    res.status(201).json({
      message: 'Benefit plan created successfully',
      benefitPlan: result.rows[0]
    });
  } catch (error) {
    console.error('Create benefit plan error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update benefit plan
 */
const updateBenefitPlan = async (req, res) => {
  const { id } = req.params;
  const { 
    name, description, benefit_type, is_active,
    start_date, end_date, provider, policy_number, coverage_details,
    eligibility_criteria, cost_to_company, cost_to_employee
  } = req.body;
  
  try {
    // Check if plan exists
    const planCheck = await pgPool.query(
      'SELECT id FROM compensation.benefit_plans WHERE id = $1',
      [id]
    );
    
    if (planCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Benefit plan not found' });
    }
    
    const result = await pgPool.query(
      `UPDATE compensation.benefit_plans 
      SET name = COALESCE($1, name), 
          description = $2, 
          benefit_type = COALESCE($3, benefit_type), 
          is_active = COALESCE($4, is_active),
          start_date = $5,
          end_date = $6,
          provider = $7,
          policy_number = $8,
          coverage_details = $9,
          eligibility_criteria = $10,
          cost_to_company = $11,
          cost_to_employee = $12,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $13
      RETURNING id, name, benefit_type, is_active, start_date, end_date`,
      [
        name, description, benefit_type, is_active,
        start_date, end_date, provider, policy_number, coverage_details,
        eligibility_criteria, cost_to_company, cost_to_employee, id
      ]
    );
    
    res.status(200).json({
      message: 'Benefit plan updated successfully',
      benefitPlan: result.rows[0]
    });
  } catch (error) {
    console.error('Update benefit plan error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Delete benefit plan
 */
const deleteBenefitPlan = async (req, res) => {
  const { id } = req.params;
  
  try {
    // Check if plan exists
    const planCheck = await pgPool.query(
      'SELECT id FROM compensation.benefit_plans WHERE id = $1',
      [id]
    );
    
    if (planCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Benefit plan not found' });
    }
    
    // Check if plan has enrollments
    const enrollmentCheck = await pgPool.query(
      'SELECT id FROM compensation.employee_benefits WHERE benefit_plan_id = $1 LIMIT 1',
      [id]
    );
    
    if (enrollmentCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Cannot delete plan with existing enrollments' });
    }
    
    await pgPool.query(
      'DELETE FROM compensation.benefit_plans WHERE id = $1',
      [id]
    );
    
    res.status(200).json({
      message: 'Benefit plan deleted successfully'
    });
  } catch (error) {
    console.error('Delete benefit plan error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get employee benefits
 */
const getEmployeeBenefits = async (req, res) => {
  const { employee_id } = req.params;
  
  try {
    const result = await pgPool.query(
      `SELECT eb.id, eb.benefit_plan_id, eb.enrollment_date, eb.status,
      bp.name as plan_name, bp.benefit_type, bp.provider, bp.coverage_details,
      bp.cost_to_company, bp.cost_to_employee
      FROM compensation.employee_benefits eb
      JOIN compensation.benefit_plans bp ON eb.benefit_plan_id = bp.id
      WHERE eb.employee_id = $1
      ORDER BY bp.name`,
      [employee_id]
    );
    
    res.status(200).json({
      employeeBenefits: result.rows
    });
  } catch (error) {
    console.error('Get employee benefits error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Enroll employee in benefit plan
 */
const enrollEmployeeBenefit = async (req, res) => {
  const { 
    employee_id, benefit_plan_id, enrollment_date, coverage_level,
    dependents, additional_details
  } = req.body;
  
  if (!employee_id || !benefit_plan_id) {
    return res.status(400).json({ error: 'Employee ID and benefit plan ID are required' });
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
    
    // Check if benefit plan exists and is active
    const planCheck = await pgPool.query(
      'SELECT id, is_active FROM compensation.benefit_plans WHERE id = $1',
      [benefit_plan_id]
    );
    
    if (planCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Benefit plan not found' });
    }
    
    if (!planCheck.rows[0].is_active) {
      return res.status(400).json({ error: 'Benefit plan is not active' });
    }
    
    // Check if employee is already enrolled in this plan
    const enrollmentCheck = await pgPool.query(
      'SELECT id FROM compensation.employee_benefits WHERE employee_id = $1 AND benefit_plan_id = $2',
      [employee_id, benefit_plan_id]
    );
    
    if (enrollmentCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Employee is already enrolled in this plan' });
    }
    
    const result = await pgPool.query(
      `INSERT INTO compensation.employee_benefits 
      (employee_id, benefit_plan_id, enrollment_date, status, coverage_level,
      dependents, additional_details, created_by, created_at, updated_at) 
      VALUES ($1, $2, $3, 'active', $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
      RETURNING id, employee_id, benefit_plan_id, enrollment_date, status`,
      [
        employee_id, benefit_plan_id, 
        enrollment_date || new Date(), 
        coverage_level, dependents, additional_details, req.user.id
      ]
    );
    
    res.status(201).json({
      message: 'Employee enrolled in benefit plan successfully',
      enrollment: result.rows[0]
    });
  } catch (error) {
    console.error('Enroll employee benefit error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update employee benefit enrollment
 */
const updateEmployeeBenefit = async (req, res) => {
  const { id } = req.params;
  const { status, coverage_level, dependents, additional_details } = req.body;
  
  try {
    // Check if enrollment exists
    const enrollmentCheck = await pgPool.query(
      'SELECT id FROM compensation.employee_benefits WHERE id = $1',
      [id]
    );
    
    if (enrollmentCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Benefit enrollment not found' });
    }
    
    const result = await pgPool.query(
      `UPDATE compensation.employee_benefits 
      SET status = COALESCE($1, status), 
          coverage_level = $2, 
          dependents = $3, 
          additional_details = $4,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING id, employee_id, benefit_plan_id, status, coverage_level`,
      [
        status, coverage_level, dependents, additional_details, id
      ]
    );
    
    res.status(200).json({
      message: 'Employee benefit updated successfully',
      enrollment: result.rows[0]
    });
  } catch (error) {
    console.error('Update employee benefit error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Terminate employee benefit enrollment
 */
const terminateEmployeeBenefit = async (req, res) => {
  const { id } = req.params;
  const { termination_date, termination_reason } = req.body;
  
  if (!termination_date) {
    return res.status(400).json({ error: 'Termination date is required' });
  }
  
  try {
    // Check if enrollment exists
    const enrollmentCheck = await pgPool.query(
      'SELECT id, status FROM compensation.employee_benefits WHERE id = $1',
      [id]
    );
    
    if (enrollmentCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Benefit enrollment not found' });
    }
    
    if (enrollmentCheck.rows[0].status === 'terminated') {
      return res.status(400).json({ error: 'Benefit enrollment is already terminated' });
    }
    
    const result = await pgPool.query(
      `UPDATE compensation.employee_benefits 
      SET status = 'terminated', 
          termination_date = $1, 
          termination_reason = $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING id, employee_id, benefit_plan_id, status, termination_date`,
      [
        termination_date, termination_reason, id
      ]
    );
    
    res.status(200).json({
      message: 'Employee benefit terminated successfully',
      enrollment: result.rows[0]
    });
  } catch (error) {
    console.error('Terminate employee benefit error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getBenefitPlans,
  getBenefitPlanById,
  createBenefitPlan,
  updateBenefitPlan,
  deleteBenefitPlan,
  getEmployeeBenefits,
  enrollEmployeeBenefit,
  updateEmployeeBenefit,
  terminateEmployeeBenefit
};
