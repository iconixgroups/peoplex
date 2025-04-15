const pool = require('../../../config/database');

// Payroll Processing
const getPayrollRuns = async (req, res) => {
  try {
    const { organization_id, status } = req.query;
    
    const query = `
      SELECT pr.*, 
             e.first_name || ' ' || e.last_name as employee_name,
             d.name as department_name
      FROM payroll_runs pr
      JOIN employees e ON pr.employee_id = e.id
      JOIN departments d ON e.department_id = d.id
      WHERE pr.organization_id = $1
      ${status ? 'AND pr.status = $2' : ''}
      ORDER BY pr.pay_period_end DESC
    `;
    
    const values = status ? [organization_id, status] : [organization_id];
    const result = await pool.query(query, values);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching payroll runs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createPayrollRun = async (req, res) => {
  try {
    const {
      organization_id,
      employee_id,
      pay_period_start,
      pay_period_end,
      gross_pay,
      deductions,
      net_pay,
      status
    } = req.body;
    
    const query = `
      INSERT INTO payroll_runs (
        organization_id,
        employee_id,
        pay_period_start,
        pay_period_end,
        gross_pay,
        deductions,
        net_pay,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const values = [
      organization_id,
      employee_id,
      pay_period_start,
      pay_period_end,
      gross_pay,
      deductions,
      net_pay,
      status
    ];
    
    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating payroll run:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Payroll Entries
const getPayrollEntries = async (req, res) => {
  try {
    const { organization_id, run_id } = req.query;
    
    // Placeholder implementation
    res.json({
      message: 'Get payroll entries - Not yet implemented',
      entries: []
    });
  } catch (error) {
    console.error('Error fetching payroll entries:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createPayrollEntry = async (req, res) => {
  try {
    const {
      organization_id,
      run_id,
      employee_id,
      component_id,
      amount,
      type
    } = req.body;
    
    // Placeholder implementation
    res.status(201).json({
      message: 'Create payroll entry - Not yet implemented',
      entry: {
        id: 1,
        organization_id,
        run_id,
        employee_id,
        component_id,
        amount,
        type
      }
    });
  } catch (error) {
    console.error('Error creating payroll entry:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Salary Components
const getSalaryComponents = async (req, res) => {
  try {
    const { organization_id, type } = req.query;
    
    const query = `
      SELECT * FROM salary_components
      WHERE organization_id = $1
      ${type ? 'AND type = $2' : ''}
      ORDER BY name
    `;
    
    const values = type ? [organization_id, type] : [organization_id];
    const result = await pool.query(query, values);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching salary components:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createSalaryComponent = async (req, res) => {
  try {
    const {
      organization_id,
      name,
      type,
      amount,
      is_taxable,
      is_active
    } = req.body;
    
    const query = `
      INSERT INTO salary_components (
        organization_id,
        name,
        type,
        amount,
        is_taxable,
        is_active
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const values = [
      organization_id,
      name,
      type,
      amount,
      is_taxable,
      is_active
    ];
    
    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating salary component:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Tax Configurations
const getTaxConfigurations = async (req, res) => {
  try {
    const { organization_id, year } = req.query;
    
    // Placeholder implementation
    res.json({
      message: 'Get tax configurations - Not yet implemented',
      configurations: []
    });
  } catch (error) {
    console.error('Error fetching tax configurations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createTaxConfiguration = async (req, res) => {
  try {
    const {
      organization_id,
      year,
      tax_brackets,
      deduction_rules
    } = req.body;
    
    // Placeholder implementation
    res.status(201).json({
      message: 'Create tax configuration - Not yet implemented',
      configuration: {
        id: 1,
        organization_id,
        year,
        tax_brackets,
        deduction_rules
      }
    });
  } catch (error) {
    console.error('Error creating tax configuration:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Benefits
const getBenefits = async (req, res) => {
  try {
    const { organization_id, type } = req.query;
    
    // Placeholder implementation
    res.json({
      message: 'Get benefits - Not yet implemented',
      benefits: []
    });
  } catch (error) {
    console.error('Error fetching benefits:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createBenefit = async (req, res) => {
  try {
    const {
      organization_id,
      name,
      description,
      type,
      amount,
      is_taxable
    } = req.body;
    
    // Placeholder implementation
    res.status(201).json({
      message: 'Create benefit - Not yet implemented',
      benefit: {
        id: 1,
        organization_id,
        name,
        description,
        type,
        amount,
        is_taxable
      }
    });
  } catch (error) {
    console.error('Error creating benefit:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Tax Calculations
const getTaxCalculations = async (req, res) => {
  try {
    const { organization_id, employee_id, year } = req.query;
    
    const query = `
      SELECT tc.*, 
             e.first_name || ' ' || e.last_name as employee_name
      FROM tax_calculations tc
      JOIN employees e ON tc.employee_id = e.id
      WHERE tc.organization_id = $1
      ${employee_id ? 'AND tc.employee_id = $2' : ''}
      ${year ? 'AND tc.year = $3' : ''}
      ORDER BY tc.year DESC, tc.month DESC
    `;
    
    const values = [organization_id];
    if (employee_id) values.push(employee_id);
    if (year) values.push(year);
    
    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching tax calculations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createTaxCalculation = async (req, res) => {
  try {
    const {
      organization_id,
      employee_id,
      year,
      month,
      gross_income,
      tax_deductions,
      net_tax
    } = req.body;
    
    const query = `
      INSERT INTO tax_calculations (
        organization_id,
        employee_id,
        year,
        month,
        gross_income,
        tax_deductions,
        net_tax
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const values = [
      organization_id,
      employee_id,
      year,
      month,
      gross_income,
      tax_deductions,
      net_tax
    ];
    
    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating tax calculation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  // Payroll Runs
  getPayrollRuns,
  createPayrollRun,
  
  // Payroll Entries
  getPayrollEntries,
  createPayrollEntry,
  
  // Tax Configurations
  getTaxConfigurations,
  createTaxConfiguration,
  
  // Benefits
  getBenefits,
  createBenefit,
  
  // Salary Components
  getSalaryComponents,
  createSalaryComponent,
  
  // Tax Calculations
  getTaxCalculations,
  createTaxCalculation
}; 