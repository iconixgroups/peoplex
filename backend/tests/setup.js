// Test setup for People X
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Create test database connection
const testPool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.TEST_DB_NAME || 'people_x_test',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

// Helper function to reset database to a clean state
const resetDatabase = async () => {
  const client = await testPool.connect();
  try {
    await client.query('BEGIN');
    
    // Truncate all tables with cascade
    await client.query(`
      TRUNCATE TABLE 
        security.users, 
        security.invitations,
        security.login_history,
        security.audit_logs,
        core.organizations,
        core.departments,
        core.locations,
        core.job_titles,
        hr.employees,
        hr.attendance_records,
        hr.leave_requests,
        recruitment.job_postings,
        recruitment.candidates,
        recruitment.applications,
        recruitment.interviews,
        performance.performance_reviews,
        performance.review_templates,
        performance.goals,
        learning.courses,
        learning.course_modules,
        learning.enrollments,
        learning.module_progress,
        compensation.employee_salaries,
        compensation.benefit_plans,
        compensation.employee_benefits,
        payroll.payroll_periods,
        payroll.payroll_runs,
        payroll.payslips,
        workflow.workflow_definitions,
        workflow.workflow_steps,
        workflow.workflow_instances,
        workflow.workflow_instance_steps,
        forms.form_templates,
        forms.form_fields,
        forms.form_submissions,
        ai.query_logs
      CASCADE
    `);
    
    // Create test organization
    const orgResult = await client.query(`
      INSERT INTO core.organizations (name, created_at, updated_at)
      VALUES ('Test Organization', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id
    `);
    const orgId = orgResult.rows[0].id;
    
    // Create test user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('TestPassword123', salt);
    
    const userResult = await client.query(`
      INSERT INTO security.users (
        email, username, password, first_name, last_name, 
        role, organization_id, status, created_at, updated_at
      )
      VALUES (
        'admin@test.com', 'admin', $1, 'Admin', 'User', 
        'admin', $2, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
      RETURNING id
    `, [hashedPassword, orgId]);
    const userId = userResult.rows[0].id;
    
    // Create test departments
    await client.query(`
      INSERT INTO core.departments (name, organization_id, created_at, updated_at)
      VALUES 
        ('Engineering', $1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('Marketing', $1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('Sales', $1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('Human Resources', $1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [orgId]);
    
    // Create test locations
    await client.query(`
      INSERT INTO core.locations (name, address, city, state, country, organization_id, created_at, updated_at)
      VALUES 
        ('Headquarters', '123 Main St', 'San Francisco', 'CA', 'USA', $1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('Remote Office', '456 Market St', 'New York', 'NY', 'USA', $1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [orgId]);
    
    // Create test job titles
    await client.query(`
      INSERT INTO core.job_titles (title, department_id, organization_id, created_at, updated_at)
      VALUES 
        ('Software Engineer', 1, $1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('Marketing Manager', 2, $1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('Sales Representative', 3, $1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('HR Specialist', 4, $1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [orgId]);
    
    await client.query('COMMIT');
    
    return {
      organizationId: orgId,
      userId: userId
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Helper function to generate test JWT token
const generateTestToken = (userId, role = 'admin', organizationId) => {
  return jwt.sign(
    { id: userId, role, organization_id: organizationId },
    process.env.JWT_SECRET || 'people_x_jwt_secret',
    { expiresIn: '1h' }
  );
};

// Export test utilities
module.exports = {
  testPool,
  resetDatabase,
  generateTestToken
};
