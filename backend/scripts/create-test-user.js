// Script to create a test user
const bcrypt = require('bcryptjs');
const { pgPool } = require('../src/config/database');

async function createTestUser() {
  try {
    // Check if test user already exists
    const userCheck = await pgPool.query(
      'SELECT * FROM security.users WHERE email = $1',
      ['test@example.com']
    );
    
    if (userCheck.rows.length > 0) {
      console.log('Test user already exists');
      await pgPool.end();
      return;
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Test@123', salt);
    
    // Create test user
    const result = await pgPool.query(
      `INSERT INTO security.users 
      (organization_id, username, email, password, first_name, last_name, role, status, created_at, updated_at) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
      RETURNING id, username, email, first_name, last_name, role, organization_id, status`,
      [1, 'testuser', 'test@example.com', passwordHash, 'Test', 'User', 'admin', 'active']
    );
    
    console.log('Test user created successfully:', result.rows[0]);
    
    // Close the database connection
    await pgPool.end();
  } catch (error) {
    console.error('Error creating test user:', error);
    process.exit(1);
  }
}

// Run the function
createTestUser(); 