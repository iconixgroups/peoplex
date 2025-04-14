// Payroll Controller for People X
const { pgPool } = require('../../config/database');

/**
 * Get all payroll periods for an organization
 */
const getPayrollPeriods = async (req, res) => {
  const { organizationId } = req.query;
  
  if (!organizationId) {
    return res.status(400).json({ error: 'Organization ID is required' });
  }
  
  try {
    const result = await pgPool.query(
      `SELECT id, period_name, start_date, end_date, payment_date, status, created_at, updated_at
      FROM payroll.payroll_periods
      WHERE organization_id = $1
      ORDER BY start_date DESC`,
      [organizationId]
    );
    
    res.status(200).json({
      payrollPeriods: result.rows
    });
  } catch (error) {
    console.error('Get payroll periods error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get payroll period by ID
 */
const getPayrollPeriodById = async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pgPool.query(
      `SELECT id, organization_id, period_name, start_date, end_date, 
      payment_date, status, notes, created_at, updated_at
      FROM payroll.payroll_periods
      WHERE id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Payroll period not found' });
    }
    
    // Get payroll runs for this period
    const runsResult = await pgPool.query(
      `SELECT id, run_date, status, total_employees, total_amount, notes
      FROM payroll.payroll_runs
      WHERE payroll_period_id = $1
      ORDER BY run_date DESC`,
      [id]
    );
    
    const payrollPeriod = {
      ...result.rows[0],
      payrollRuns: runsResult.rows
    };
    
    res.status(200).json({
      payrollPeriod
    });
  } catch (error) {
    console.error('Get payroll period error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Create new payroll period
 */
const createPayrollPeriod = async (req, res) => {
  const { 
    organization_id, period_name, start_date, end_date, 
    payment_date, status, notes
  } = req.body;
  
  if (!organization_id || !period_name || !start_date || !end_date || !payment_date) {
    return res.status(400).json({ error: 'Organization ID, period name, start date, end date, and payment date are required' });
  }
  
  try {
    // Check for overlapping periods
    const overlapCheck = await pgPool.query(
      `SELECT id FROM payroll.payroll_periods 
      WHERE organization_id = $1 
      AND ((start_date <= $2 AND end_date >= $2) OR (start_date <= $3 AND end_date >= $3))`,
      [organization_id, start_date, end_date]
    );
    
    if (overlapCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Payroll period overlaps with an existing period' });
    }
    
    const result = await pgPool.query(
      `INSERT INTO payroll.payroll_periods 
      (organization_id, period_name, start_date, end_date, payment_date, status, notes, created_at, updated_at) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
      RETURNING id, period_name, start_date, end_date, payment_date, status`,
      [
        organization_id, period_name, start_date, end_date, 
        payment_date, status || 'pending', notes
      ]
    );
    
    res.status(201).json({
      message: 'Payroll period created successfully',
      payrollPeriod: result.rows[0]
    });
  } catch (error) {
    console.error('Create payroll period error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update payroll period
 */
const updatePayrollPeriod = async (req, res) => {
  const { id } = req.params;
  const { 
    period_name, start_date, end_date, payment_date, status, notes
  } = req.body;
  
  try {
    // Check if period exists
    const periodCheck = await pgPool.query(
      'SELECT id, organization_id FROM payroll.payroll_periods WHERE id = $1',
      [id]
    );
    
    if (periodCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Payroll period not found' });
    }
    
    // Check for overlapping periods if dates are changing
    if (start_date || end_date) {
      const currentPeriod = await pgPool.query(
        'SELECT start_date, end_date FROM payroll.payroll_periods WHERE id = $1',
        [id]
      );
      
      const newStartDate = start_date || currentPeriod.rows[0].start_date;
      const newEndDate = end_date || currentPeriod.rows[0].end_date;
      
      const overlapCheck = await pgPool.query(
        `SELECT id FROM payroll.payroll_periods 
        WHERE organization_id = $1 AND id != $2
        AND ((start_date <= $3 AND end_date >= $3) OR (start_date <= $4 AND end_date >= $4))`,
        [periodCheck.rows[0].organization_id, id, newStartDate, newEndDate]
      );
      
      if (overlapCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Updated payroll period would overlap with an existing period' });
      }
    }
    
    const result = await pgPool.query(
      `UPDATE payroll.payroll_periods 
      SET period_name = COALESCE($1, period_name), 
          start_date = COALESCE($2, start_date), 
          end_date = COALESCE($3, end_date), 
          payment_date = COALESCE($4, payment_date),
          status = COALESCE($5, status),
          notes = $6,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING id, period_name, start_date, end_date, payment_date, status`,
      [
        period_name, start_date, end_date, payment_date, status, notes, id
      ]
    );
    
    res.status(200).json({
      message: 'Payroll period updated successfully',
      payrollPeriod: result.rows[0]
    });
  } catch (error) {
    console.error('Update payroll period error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Create payroll run
 */
const createPayrollRun = async (req, res) => {
  const { payroll_period_id } = req.params;
  const { run_date, notes } = req.body;
  
  try {
    // Check if period exists and is in valid status
    const periodCheck = await pgPool.query(
      'SELECT id, organization_id, status FROM payroll.payroll_periods WHERE id = $1',
      [payroll_period_id]
    );
    
    if (periodCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Payroll period not found' });
    }
    
    if (periodCheck.rows[0].status === 'closed') {
      return res.status(400).json({ error: 'Cannot create run for a closed payroll period' });
    }
    
    // Start a transaction
    const client = await pgPool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Create payroll run
      const runResult = await client.query(
        `INSERT INTO payroll.payroll_runs 
        (payroll_period_id, run_date, status, notes, created_by, created_at, updated_at) 
        VALUES ($1, $2, 'processing', $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
        RETURNING id, payroll_period_id, run_date, status`,
        [
          payroll_period_id, run_date || new Date(), notes, req.user.id
        ]
      );
      
      const runId = runResult.rows[0].id;
      
      // Get all active employees
      const employeesResult = await client.query(
        `SELECT e.id, e.user_id, e.first_name, e.last_name, e.job_title_id, 
        e.department_id, e.location_id, e.employment_status, e.employment_type
        FROM hr.employees e
        WHERE e.organization_id = $1 
        AND e.employment_status = 'active'`,
        [periodCheck.rows[0].organization_id]
      );
      
      // Get latest salary for each employee
      let totalAmount = 0;
      let employeeCount = 0;
      
      for (const employee of employeesResult.rows) {
        // Get employee's salary
        const salaryResult = await client.query(
          `SELECT salary_amount, currency, salary_type, payment_frequency
          FROM compensation.employee_salaries
          WHERE employee_id = $1
          ORDER BY effective_date DESC
          LIMIT 1`,
          [employee.id]
        );
        
        if (salaryResult.rows.length === 0) {
          console.warn(`No salary record found for employee ${employee.id}`);
          continue;
        }
        
        const salary = salaryResult.rows[0];
        
        // Calculate pay amount based on payment frequency
        let payAmount = parseFloat(salary.salary_amount);
        
        // Adjust amount based on payment frequency
        switch (salary.payment_frequency) {
          case 'annual':
            payAmount = payAmount / 12; // Monthly equivalent
            break;
          case 'semi_monthly':
            // Already semi-monthly, no adjustment needed
            break;
          case 'bi_weekly':
            payAmount = (payAmount * 26) / 12; // Convert to monthly equivalent
            break;
          case 'weekly':
            payAmount = (payAmount * 52) / 12; // Convert to monthly equivalent
            break;
          case 'daily':
            payAmount = payAmount * 22; // Assuming 22 working days per month
            break;
          case 'hourly':
            payAmount = payAmount * 8 * 22; // Assuming 8 hours per day, 22 days per month
            break;
        }
        
        // Get employee's benefits
        const benefitsResult = await client.query(
          `SELECT eb.id, bp.name, bp.benefit_type, bp.cost_to_employee
          FROM compensation.employee_benefits eb
          JOIN compensation.benefit_plans bp ON eb.benefit_plan_id = bp.id
          WHERE eb.employee_id = $1 AND eb.status = 'active'`,
          [employee.id]
        );
        
        // Calculate deductions
        let totalDeductions = 0;
        
        for (const benefit of benefitsResult.rows) {
          if (benefit.cost_to_employee) {
            totalDeductions += parseFloat(benefit.cost_to_employee);
          }
        }
        
        // Calculate taxes (simplified for demo)
        const taxRate = 0.2; // 20% tax rate
        const taxAmount = payAmount * taxRate;
        
        // Calculate net pay
        const netPay = payAmount - totalDeductions - taxAmount;
        
        // Create payslip
        await client.query(
          `INSERT INTO payroll.payslips 
          (payroll_run_id, employee_id, gross_pay, deductions, tax, net_pay, currency, status, created_at, updated_at) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, 'generated', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [
            runId, employee.id, payAmount.toFixed(2), totalDeductions.toFixed(2), 
            taxAmount.toFixed(2), netPay.toFixed(2), salary.currency
          ]
        );
        
        totalAmount += netPay;
        employeeCount++;
      }
      
      // Update payroll run with totals
      await client.query(
        `UPDATE payroll.payroll_runs 
        SET status = 'completed', 
            total_employees = $1,
            total_amount = $2,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $3`,
        [employeeCount, totalAmount.toFixed(2), runId]
      );
      
      // Update payroll period status
      await client.query(
        `UPDATE payroll.payroll_periods 
        SET status = 'processed', 
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1`,
        [payroll_period_id]
      );
      
      await client.query('COMMIT');
      
      res.status(201).json({
        message: 'Payroll run created successfully',
        payrollRun: {
          id: runId,
          payroll_period_id,
          run_date: run_date || new Date(),
          status: 'completed',
          total_employees: employeeCount,
          total_amount: totalAmount.toFixed(2)
        }
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Create payroll run error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get payroll run by ID
 */
const getPayrollRunById = async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pgPool.query(
      `SELECT pr.*, pp.period_name, pp.start_date, pp.end_date, pp.payment_date
      FROM payroll.payroll_runs pr
      JOIN payroll.payroll_periods pp ON pr.payroll_period_id = pp.id
      WHERE pr.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Payroll run not found' });
    }
    
    // Get payslips for this run
    const payslipsResult = await pgPool.query(
      `SELECT ps.id, ps.employee_id, ps.gross_pay, ps.deductions, ps.tax, ps.net_pay, ps.currency, ps.status,
      CONCAT(e.first_name, ' ', e.last_name) as employee_name,
      e.job_title_id, jt.title as job_title, d.name as department_name
      FROM payroll.payslips ps
      JOIN hr.employees e ON ps.employee_id = e.id
      LEFT JOIN core.job_titles jt ON e.job_title_id = jt.id
      LEFT JOIN core.departments d ON e.department_id = d.id
      WHERE ps.payroll_run_id = $1
      ORDER BY e.last_name, e.first_name`,
      [id]
    );
    
    const payrollRun = {
      ...result.rows[0],
      payslips: payslipsResult.rows
    };
    
    res.status(200).json({
      payrollRun
    });
  } catch (error) {
    console.error('Get payroll run error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get payslip by ID
 */
const getPayslipById = async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pgPool.query(
      `SELECT ps.*, 
      pr.run_date, pp.period_name, pp.start_date, pp.end_date, pp.payment_date,
      CONCAT(e.first_name, ' ', e.last_name) as employee_name,
      e.employee_id as employee_number, e.job_title_id, jt.title as job_title, 
      d.name as department_name, l.name as location_name
      FROM payroll.payslips ps
      JOIN payroll.payroll_runs pr ON ps.payroll_run_id = pr.id
      JOIN payroll.payroll_periods pp ON pr.payroll_period_id = pp.id
      JOIN hr.employees e ON ps.employee_id = e.id
      LEFT JOIN core.job_titles jt ON e.job_title_id = jt.id
      LEFT JOIN core.departments d ON e.department_id = d.id
      LEFT JOIN core.locations l ON e.location_id = l.id
      WHERE ps.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Payslip not found' });
    }
    
    // Get employee's benefits (deductions)
    const benefitsResult = await pgPool.query(
      `SELECT bp.name, bp.benefit_type, bp.cost_to_employee
      FROM compensation.employee_benefits eb
      JOIN compensation.benefit_plans bp ON eb.benefit_plan_id = bp.id
      WHERE eb.employee_id = $1 AND eb.status = 'active'`,
      [result.rows[0].employee_id]
    );
    
    const payslip = {
      ...result.rows[0],
      benefits: benefitsResult.rows
    };
    
    res.status(200).json({
      payslip
    });
  } catch (error) {
    console.error('Get payslip error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get employee payslips
 */
const getEmployeePayslips = async (req, res) => {
  const { employee_id } = req.params;
  
  try {
    const result = await pgPool.query(
      `SELECT ps.id, ps.payroll_run_id, ps.gross_pay, ps.deductions, ps.tax, ps.net_pay, ps.currency, ps.status,
      pr.run_date, pp.period_name, pp.start_date, pp.end_date, pp.payment_date
      FROM payroll.payslips ps
      JOIN payroll.payroll_runs pr ON ps.payroll_run_id = pr.id
      JOIN payroll.payroll_periods pp ON pr.payroll_period_id = pp.id
      WHERE ps.employee_id = $1
      ORDER BY pp.payment_date DESC`,
      [employee_id]
    );
    
    res.status(200).json({
      payslips: result.rows
    });
  } catch (error) {
    console.error('Get employee payslips error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getPayrollPeriods,
  getPayrollPeriodById,
  createPayrollPeriod,
  updatePayrollPeriod,
  createPayrollRun,
  getPayrollRunById,
  getPayslipById,
  getEmployeePayslips
};
