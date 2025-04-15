const bcrypt = require('bcrypt');
const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'people_x',
  password: 'postgres',
  port: 5432,
});

async function initializeDatabase() {
  try {
    // Read and execute SQL initialization script
    const sqlPath = path.join(__dirname, 'init.sql');
    const sqlContent = await fs.readFile(sqlPath, 'utf8');
    
    // Split SQL into individual statements
    const statements = sqlContent.split(';').filter(stmt => stmt.trim());
    
    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        await pool.query(statement);
      }
    }

    // Hash admin password
    const password = 'Admin@2025';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update admin user with hashed password
    await pool.query(`
      UPDATE security.users 
      SET password = $1 
      WHERE email = 'info@constructx.in'
    `, [hashedPassword]);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    await pool.end();
  }
}

initializeDatabase(); 