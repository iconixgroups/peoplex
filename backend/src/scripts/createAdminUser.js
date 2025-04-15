const bcrypt = require('bcryptjs');
const { pgPool } = require('../config/database');

async function createAdminUser() {
  try {
    // Create schemas if they don't exist
    await pgPool.query(`
      CREATE SCHEMA IF NOT EXISTS core;
      CREATE SCHEMA IF NOT EXISTS security;
      
      -- Create core.organizations table if it doesn't exist
      CREATE TABLE IF NOT EXISTS core.organizations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(50),
        domain VARCHAR(255),
        logo_url VARCHAR(512),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      -- Create security.users table if it doesn't exist
      CREATE TABLE IF NOT EXISTS security.users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'user',
        organization_id INTEGER,
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        last_login TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('Database schemas and tables created/verified');
    
    // First, check if we have the organization or create it
    const orgCheckResult = await pgPool.query(
      `SELECT id FROM core.organizations WHERE name = $1`,
      ['Construct X']
    );
    
    let orgId;
    if (orgCheckResult.rows.length === 0) {
      // Create the organization
      const orgResult = await pgPool.query(
        `INSERT INTO core.organizations 
        (name, created_at, updated_at) 
        VALUES ($1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id`,
        ['Construct X']
      );
      orgId = orgResult.rows[0].id;
      console.log('Created organization with ID:', orgId);
    } else {
      orgId = orgCheckResult.rows[0].id;
      console.log('Using existing organization with ID:', orgId);
    }
    
    // Hash the password
    const password = 'Admin@2025';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Check if user exists
    const userCheckResult = await pgPool.query(
      `SELECT id FROM security.users WHERE email = $1`,
      ['info@constructx.in']
    );
    
    let userId;
    if (userCheckResult.rows.length === 0) {
      // Create the user
      const userResult = await pgPool.query(
        `INSERT INTO security.users
        (email, username, password, first_name, last_name, role, organization_id, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id`,
        ['info@constructx.in', 'constructx', hashedPassword, 'Construct', 'X', 'admin', orgId, 'active']
      );
      userId = userResult.rows[0].id;
      console.log('Created admin user with ID:', userId);
    } else {
      userId = userCheckResult.rows[0].id;
      // Update the user with new password and make sure they're an admin
      await pgPool.query(
        `UPDATE security.users
        SET password = $1, role = 'admin', organization_id = $2, status = 'active', updated_at = CURRENT_TIMESTAMP
        WHERE id = $3`,
        [hashedPassword, orgId, userId]
      );
      console.log('Updated existing user with ID:', userId);
    }
    
    console.log('Admin user setup completed successfully');
    console.log('Email: info@constructx.in');
    console.log('Password: Admin@2025');
    console.log('Role: admin');
    console.log('Company: Construct X');
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

createAdminUser(); 