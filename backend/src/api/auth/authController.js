// Authentication Controller for People X
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pgPool } = require('../../config/database');
const config = require('../../config/config');

/**
 * User registration
 */
const register = async (req, res) => {
  const { username, email, password, organizationId } = req.body;
  
  try {
    // Check if user already exists
    const userCheck = await pgPool.query(
      'SELECT * FROM auth.users WHERE email = $1 OR username = $2',
      [email, username]
    );
    
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists with this email or username' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    // Create new user
    const result = await pgPool.query(
      `INSERT INTO auth.users 
      (organization_id, username, email, password_hash, salt, is_active, created_at, updated_at) 
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
      RETURNING id, username, email, is_active`,
      [organizationId, username, email, passwordHash, salt, true]
    );
    
    // Assign default role to user
    await pgPool.query(
      `INSERT INTO auth.user_roles (user_id, role_id, created_at)
      VALUES ($1, (SELECT id FROM auth.roles WHERE name = 'employee' AND organization_id = $2), CURRENT_TIMESTAMP)`,
      [result.rows[0].id, organizationId]
    );
    
    res.status(201).json({
      message: 'User registered successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
};

/**
 * User login
 */
const login = async (req, res) => {
  const { email, password } = req.body;
  
  try {
    // Find user by email
    const result = await pgPool.query(
      'SELECT * FROM auth.users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const user = result.rows[0];
    
    // Check if user is active
    if (!user.is_active) {
      return res.status(401).json({ error: 'Account is disabled' });
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Get user roles
    const rolesResult = await pgPool.query(
      `SELECT r.name FROM auth.roles r
      JOIN auth.user_roles ur ON r.id = ur.role_id
      WHERE ur.user_id = $1`,
      [user.id]
    );
    
    const roles = rolesResult.rows.map(row => row.name);
    
    // Get user permissions
    const permissionsResult = await pgPool.query(
      `SELECT p.code FROM auth.permissions p
      JOIN auth.role_permissions rp ON p.id = rp.permission_id
      JOIN auth.user_roles ur ON rp.role_id = ur.role_id
      WHERE ur.user_id = $1`,
      [user.id]
    );
    
    const permissions = permissionsResult.rows.map(row => row.code);
    
    // Create JWT token
    const tokenPayload = {
      id: user.id,
      username: user.username,
      email: user.email,
      organizationId: user.organization_id,
      roles,
      permissions
    };
    
    const token = jwt.sign(tokenPayload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
    const refreshToken = jwt.sign({ id: user.id }, config.jwt.secret, { expiresIn: config.jwt.refreshExpiresIn });
    
    // Update last login timestamp
    await pgPool.query(
      'UPDATE auth.users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );
    
    res.status(200).json({
      message: 'Login successful',
      token,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        roles,
        permissions
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
};

/**
 * Refresh token
 */
const refreshToken = async (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token is required' });
  }
  
  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, config.jwt.secret);
    
    // Get user data
    const result = await pgPool.query(
      'SELECT * FROM auth.users WHERE id = $1',
      [decoded.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }
    
    const user = result.rows[0];
    
    // Get user roles
    const rolesResult = await pgPool.query(
      `SELECT r.name FROM auth.roles r
      JOIN auth.user_roles ur ON r.id = ur.role_id
      WHERE ur.user_id = $1`,
      [user.id]
    );
    
    const roles = rolesResult.rows.map(row => row.name);
    
    // Get user permissions
    const permissionsResult = await pgPool.query(
      `SELECT p.code FROM auth.permissions p
      JOIN auth.role_permissions rp ON p.id = rp.permission_id
      JOIN auth.user_roles ur ON rp.role_id = ur.role_id
      WHERE ur.user_id = $1`,
      [user.id]
    );
    
    const permissions = permissionsResult.rows.map(row => row.code);
    
    // Create new JWT token
    const tokenPayload = {
      id: user.id,
      username: user.username,
      email: user.email,
      organizationId: user.organization_id,
      roles,
      permissions
    };
    
    const token = jwt.sign(tokenPayload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
    
    res.status(200).json({
      message: 'Token refreshed successfully',
      token
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
};

/**
 * Get current user profile
 */
const getProfile = async (req, res) => {
  try {
    const result = await pgPool.query(
      'SELECT id, username, email, is_active, created_at FROM auth.users WHERE id = $1',
      [req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.status(200).json({
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Change password
 */
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  try {
    // Get user data
    const result = await pgPool.query(
      'SELECT * FROM auth.users WHERE id = $1',
      [req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = result.rows[0];
    
    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);
    
    // Update password
    await pgPool.query(
      'UPDATE auth.users SET password_hash = $1, salt = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
      [passwordHash, salt, req.user.id]
    );
    
    res.status(200).json({
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  getProfile,
  changePassword
};
