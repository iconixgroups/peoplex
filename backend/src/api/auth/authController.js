// Authentication Controller for People X
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pgPool } = require('../../config/database');
const config = require('../../config/config');

/**
 * User registration
 */
const register = async (req, res) => {
  const { username, email, password, first_name, last_name, organization_id = 1 } = req.body;
  
  try {
    // Check if user already exists
    const userCheck = await pgPool.query(
      'SELECT * FROM security.users WHERE email = $1 OR username = $2',
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
      `INSERT INTO security.users 
      (organization_id, username, email, password, first_name, last_name, role, status, created_at, updated_at) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
      RETURNING id, username, email, first_name, last_name, role, organization_id, status`,
      [organization_id, username, email, passwordHash, first_name, last_name, 'employee', 'active']
    );
    
    // Generate JWT token
    const token = jwt.sign(
      { id: result.rows[0].id, role: 'employee', organization_id },
      process.env.JWT_SECRET || config.jwt.secret || 'people_x_jwt_secret',
      { expiresIn: '24h' }
    );
    
    res.status(201).json({
      message: 'User registered successfully',
      user: result.rows[0],
      token
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
      'SELECT * FROM security.users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const user = result.rows[0];
    
    // Check if user is active
    if (user.status !== 'active') {
      return res.status(401).json({ error: 'Account is disabled' });
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Get user roles
    const roles = [user.role]; // Using role from user table directly
    const permissions = []; // Simplified for now
    
    // Create JWT token
    const tokenPayload = {
      id: user.id,
      username: user.username,
      email: user.email,
      organizationId: user.organization_id,
      roles,
      permissions
    };
    
    const token = jwt.sign(tokenPayload, config.jwt.secret || 'people_x_jwt_secret', { expiresIn: config.jwt.expiresIn || '24h' });
    const refreshToken = jwt.sign({ id: user.id }, config.jwt.secret || 'people_x_jwt_secret', { expiresIn: config.jwt.refreshExpiresIn || '7d' });
    
    // Update last login timestamp
    await pgPool.query(
      'UPDATE security.users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );
    
    res.status(200).json({
      status: 'success',
      data: {
        token,
        expires_at: new Date(Date.now() + 86400000).toISOString(), // 24 hours
        refreshToken,
        user: {
          id: user.id,
          username: user.username,
          first_name: user.first_name,
          last_name: user.last_name,
          is_admin: user.role === 'admin'
        }
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
    const decoded = jwt.verify(refreshToken, config.jwt.secret || 'people_x_jwt_secret');
    
    // Get user data
    const result = await pgPool.query(
      'SELECT * FROM security.users WHERE id = $1',
      [decoded.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }
    
    const user = result.rows[0];
    
    // Create new JWT token
    const tokenPayload = {
      id: user.id,
      username: user.username,
      email: user.email,
      organizationId: user.organization_id,
      roles: [user.role],
      permissions: []
    };
    
    const token = jwt.sign(tokenPayload, config.jwt.secret || 'people_x_jwt_secret', { expiresIn: config.jwt.expiresIn || '24h' });
    
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
      'SELECT id, username, email, first_name, last_name, role, status, created_at FROM security.users WHERE id = $1',
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
      'SELECT * FROM security.users WHERE id = $1',
      [req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = result.rows[0];
    
    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);
    
    // Update password
    await pgPool.query(
      'UPDATE security.users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [passwordHash, req.user.id]
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
