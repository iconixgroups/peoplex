// Employee Controller for People X
const { pgPool } = require('../../config/database');
const bcrypt = require('bcryptjs');

/**
 * Get all employees for an organization
 */
const getEmployees = async (req, res) => {
  const { organizationId, departmentId, locationId, jobTitleId } = req.query;
  
  if (!organizationId) {
    return res.status(400).json({ error: 'Organization ID is required' });
  }
  
  try {
    let query = `
      SELECT e.id, e.employee_id, e.first_name, e.middle_name, e.last_name, e.display_name,
      e.department_id, d.name as department_name,
      e.job_title_id, j.title as job_title,
      e.location_id, l.name as location_name,
      e.manager_id, CONCAT(m.first_name, ' ', m.last_name) as manager_name,
      e.employment_status, e.employment_type, e.hire_date
      FROM hr.employees e
      LEFT JOIN core.departments d ON e.department_id = d.id
      LEFT JOIN core.job_titles j ON e.job_title_id = j.id
      LEFT JOIN core.locations l ON e.location_id = l.id
      LEFT JOIN hr.employees m ON e.manager_id = m.id
      WHERE e.organization_id = $1
    `;
    
    const queryParams = [organizationId];
    let paramIndex = 2;
    
    if (departmentId) {
      query += ` AND e.department_id = $${paramIndex}`;
      queryParams.push(departmentId);
      paramIndex++;
    }
    
    if (locationId) {
      query += ` AND e.location_id = $${paramIndex}`;
      queryParams.push(locationId);
      paramIndex++;
    }
    
    if (jobTitleId) {
      query += ` AND e.job_title_id = $${paramIndex}`;
      queryParams.push(jobTitleId);
      paramIndex++;
    }
    
    query += ` ORDER BY e.first_name, e.last_name`;
    
    const result = await pgPool.query(query, queryParams);
    
    res.status(200).json({
      employees: result.rows
    });
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get employee by ID
 */
const getEmployeeById = async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pgPool.query(
      `SELECT e.*, 
      d.name as department_name,
      j.title as job_title,
      l.name as location_name,
      CONCAT(m.first_name, ' ', m.last_name) as manager_name
      FROM hr.employees e
      LEFT JOIN core.departments d ON e.department_id = d.id
      LEFT JOIN core.job_titles j ON e.job_title_id = j.id
      LEFT JOIN core.locations l ON e.location_id = l.id
      LEFT JOIN hr.employees m ON e.manager_id = m.id
      WHERE e.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    // Get employee documents
    const documentsResult = await pgPool.query(
      `SELECT id, document_type, document_name, file_path, upload_date, expiry_date, is_verified
      FROM hr.employee_documents
      WHERE employee_id = $1`,
      [id]
    );
    
    // Get direct reports
    const reportsResult = await pgPool.query(
      `SELECT id, employee_id, first_name, last_name, job_title_id, 
      (SELECT title FROM core.job_titles WHERE id = job_title_id) as job_title
      FROM hr.employees
      WHERE manager_id = $1
      ORDER BY first_name, last_name`,
      [id]
    );
    
    // Get user account information
    const userResult = await pgPool.query(
      `SELECT u.id, u.username, u.email, u.is_active, u.last_login,
      array_agg(r.name) as roles
      FROM auth.users u
      LEFT JOIN auth.user_roles ur ON u.id = ur.user_id
      LEFT JOIN auth.roles r ON ur.role_id = r.id
      WHERE u.id = $1
      GROUP BY u.id, u.username, u.email, u.is_active, u.last_login`,
      [result.rows[0].user_id]
    );
    
    const employee = {
      ...result.rows[0],
      documents: documentsResult.rows,
      direct_reports: reportsResult.rows,
      user: userResult.rows.length > 0 ? userResult.rows[0] : null
    };
    
    // Remove sensitive information
    delete employee.social_security_number;
    delete employee.tax_id;
    
    res.status(200).json({
      employee
    });
  } catch (error) {
    console.error('Get employee error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Create new employee
 */
const createEmployee = async (req, res) => {
  const { 
    organization_id, first_name, middle_name, last_name, display_name,
    date_of_birth, gender, marital_status, nationality,
    tax_id, social_security_number, passport_number, passport_expiry,
    phone_number, emergency_contact_name, emergency_contact_phone, emergency_contact_relation,
    address, city, state, country, postal_code,
    department_id, job_title_id, location_id, manager_id,
    employment_status, employment_type, hire_date, probation_end_date,
    email, username, password
  } = req.body;
  
  if (!organization_id || !first_name || !last_name || !email || !username || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  // Start a transaction
  const client = await pgPool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Check if user already exists
    const userCheck = await client.query(
      'SELECT * FROM auth.users WHERE email = $1 OR username = $2',
      [email, username]
    );
    
    if (userCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'User already exists with this email or username' });
    }
    
    // Generate employee ID
    const employeeIdResult = await client.query(
      `SELECT COUNT(*) + 1 as next_id FROM hr.employees WHERE organization_id = $1`,
      [organization_id]
    );
    
    const employeeId = `EMP${organization_id}-${employeeIdResult.rows[0].next_id.toString().padStart(5, '0')}`;
    
    // Create user account
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    const userResult = await client.query(
      `INSERT INTO auth.users 
      (organization_id, username, email, password_hash, salt, is_active, created_at, updated_at) 
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
      RETURNING id`,
      [organization_id, username, email, passwordHash, salt, true]
    );
    
    const userId = userResult.rows[0].id;
    
    // Assign default employee role
    await client.query(
      `INSERT INTO auth.user_roles (user_id, role_id, created_at)
      VALUES ($1, (SELECT id FROM auth.roles WHERE name = 'employee' AND organization_id = $2), CURRENT_TIMESTAMP)`,
      [userId, organization_id]
    );
    
    // Create employee record
    const employeeResult = await client.query(
      `INSERT INTO hr.employees 
      (user_id, organization_id, employee_id, first_name, middle_name, last_name, display_name,
      date_of_birth, gender, marital_status, nationality,
      tax_id, social_security_number, passport_number, passport_expiry,
      phone_number, emergency_contact_name, emergency_contact_phone, emergency_contact_relation,
      address, city, state, country, postal_code,
      department_id, job_title_id, location_id, manager_id,
      employment_status, employment_type, hire_date, probation_end_date,
      created_at, updated_at) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
      RETURNING id`,
      [
        userId, organization_id, employeeId, first_name, middle_name, last_name, display_name || `${first_name} ${last_name}`,
        date_of_birth, gender, marital_status, nationality,
        tax_id, social_security_number, passport_number, passport_expiry,
        phone_number, emergency_contact_name, emergency_contact_phone, emergency_contact_relation,
        address, city, state, country, postal_code,
        department_id, job_title_id, location_id, manager_id,
        employment_status, employment_type, hire_date, probation_end_date
      ]
    );
    
    await client.query('COMMIT');
    
    res.status(201).json({
      message: 'Employee created successfully',
      employee: {
        id: employeeResult.rows[0].id,
        employee_id: employeeId,
        first_name,
        last_name,
        email,
        username
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create employee error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

/**
 * Update employee
 */
const updateEmployee = async (req, res) => {
  const { id } = req.params;
  const { 
    first_name, middle_name, last_name, display_name,
    date_of_birth, gender, marital_status, nationality,
    tax_id, social_security_number, passport_number, passport_expiry,
    phone_number, emergency_contact_name, emergency_contact_phone, emergency_contact_relation,
    address, city, state, country, postal_code,
    department_id, job_title_id, location_id, manager_id,
    employment_status, employment_type, probation_end_date, termination_date, termination_reason
  } = req.body;
  
  try {
    // Check if employee exists
    const empCheck = await pgPool.query(
      'SELECT id, organization_id FROM hr.employees WHERE id = $1',
      [id]
    );
    
    if (empCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    // Prevent circular manager reference
    if (manager_id && parseInt(manager_id) === parseInt(id)) {
      return res.status(400).json({ error: 'Employee cannot be their own manager' });
    }
    
    // Update employee record
    const result = await pgPool.query(
      `UPDATE hr.employees 
      SET first_name = COALESCE($1, first_name),
          middle_name = $2,
          last_name = COALESCE($3, last_name),
          display_name = COALESCE($4, display_name),
          date_of_birth = $5,
          gender = $6,
          marital_status = $7,
          nationality = $8,
          tax_id = $9,
          social_security_number = $10,
          passport_number = $11,
          passport_expiry = $12,
          phone_number = $13,
          emergency_contact_name = $14,
          emergency_contact_phone = $15,
          emergency_contact_relation = $16,
          address = $17,
          city = $18,
          state = $19,
          country = $20,
          postal_code = $21,
          department_id = $22,
          job_title_id = $23,
          location_id = $24,
          manager_id = $25,
          employment_status = COALESCE($26, employment_status),
          employment_type = COALESCE($27, employment_type),
          probation_end_date = $28,
          termination_date = $29,
          termination_reason = $30,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $31
      RETURNING id, employee_id, first_name, last_name, display_name, department_id, job_title_id, employment_status`,
      [
        first_name, middle_name, last_name, display_name,
        date_of_birth, gender, marital_status, nationality,
        tax_id, social_security_number, passport_number, passport_expiry,
        phone_number, emergency_contact_name, emergency_contact_phone, emergency_contact_relation,
        address, city, state, country, postal_code,
        department_id, job_title_id, location_id, manager_id,
        employment_status, employment_type, probation_end_date, termination_date, termination_reason,
        id
      ]
    );
    
    res.status(200).json({
      message: 'Employee updated successfully',
      employee: result.rows[0]
    });
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Upload employee document
 */
const uploadDocument = async (req, res) => {
  const { employee_id } = req.params;
  const { document_type, document_name, file_path, expiry_date } = req.body;
  
  if (!document_type || !document_name || !file_path) {
    return res.status(400).json({ error: 'Document type, name, and file path are required' });
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
      `INSERT INTO hr.employee_documents 
      (employee_id, document_type, document_name, file_path, uploaded_by, upload_date, expiry_date, is_verified, created_at, updated_at) 
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, $6, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
      RETURNING id, document_type, document_name, file_path, upload_date, expiry_date`,
      [employee_id, document_type, document_name, file_path, req.user.id, expiry_date]
    );
    
    res.status(201).json({
      message: 'Document uploaded successfully',
      document: result.rows[0]
    });
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Verify employee document
 */
const verifyDocument = async (req, res) => {
  const { document_id } = req.params;
  
  try {
    // Check if document exists
    const docCheck = await pgPool.query(
      'SELECT id, is_verified FROM hr.employee_documents WHERE id = $1',
      [document_id]
    );
    
    if (docCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    if (docCheck.rows[0].is_verified) {
      return res.status(400).json({ error: 'Document is already verified' });
    }
    
    const result = await pgPool.query(
      `UPDATE hr.employee_documents 
      SET is_verified = true, 
          verified_by = $1, 
          verification_date = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, document_type, document_name, is_verified, verification_date`,
      [req.user.id, document_id]
    );
    
    res.status(200).json({
      message: 'Document verified successfully',
      document: result.rows[0]
    });
  } catch (error) {
    console.error('Verify document error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  uploadDocument,
  verifyDocument
};
