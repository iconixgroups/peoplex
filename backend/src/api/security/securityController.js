// Security Controller for People X
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pgPool } = require('../../config/database');
const { decryptData } = require('../../middleware/security');

/**
 * User registration
 */
const registerUser = async (req, res) => {
  const { 
    email, username, password, first_name, last_name, 
    organization_id, role, invitation_token 
  } = req.body;
  
  if (!email || !username || !password || !first_name || !last_name) {
    return res.status(400).json({ error: 'Email, username, password, first name, and last name are required' });
  }
  
  try {
    // Check if email or username already exists
    const existingUserCheck = await pgPool.query(
      'SELECT id FROM security.users WHERE email = $1 OR username = $2',
      [email.toLowerCase(), username.toLowerCase()]
    );
    
    if (existingUserCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Email or username already exists' });
    }
    
    // If invitation token is provided, validate it
    if (invitation_token) {
      const invitationCheck = await pgPool.query(
        'SELECT id, email, organization_id, role, expires_at FROM security.invitations WHERE token = $1',
        [invitation_token]
      );
      
      if (invitationCheck.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid invitation token' });
      }
      
      const invitation = invitationCheck.rows[0];
      
      // Check if invitation has expired
      if (new Date(invitation.expires_at) < new Date()) {
        return res.status(400).json({ error: 'Invitation token has expired' });
      }
      
      // Check if email matches invitation
      if (invitation.email.toLowerCase() !== email.toLowerCase()) {
        return res.status(400).json({ error: 'Email does not match invitation' });
      }
      
      // Use organization and role from invitation
      organization_id = invitation.organization_id;
      role = invitation.role;
    } else if (!organization_id) {
      // If no invitation and no organization, create a new organization
      const orgResult = await pgPool.query(
        `INSERT INTO core.organizations 
        (name, created_by, created_at, updated_at) 
        VALUES ($1, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
        RETURNING id`,
        [`${first_name}'s Organization`]
      );
      
      organization_id = orgResult.rows[0].id;
      role = 'admin'; // First user of a new organization is admin
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Start a transaction
    const client = await pgPool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Create user
      const userResult = await client.query(
        `INSERT INTO security.users 
        (email, username, password, first_name, last_name, role, organization_id, status, created_at, updated_at) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
        RETURNING id, email, username, first_name, last_name, role, organization_id, status, created_at`,
        [
          email.toLowerCase(), username.toLowerCase(), hashedPassword, 
          first_name, last_name, role || 'user', organization_id, 'active'
        ]
      );
      
      const userId = userResult.rows[0].id;
      
      // If invitation was used, mark it as used
      if (invitation_token) {
        await client.query(
          `UPDATE security.invitations 
          SET used_at = CURRENT_TIMESTAMP, used_by = $1 
          WHERE token = $2`,
          [userId, invitation_token]
        );
      }
      
      // Generate JWT token
      const token = jwt.sign(
        { id: userId, role: role || 'user', organization_id },
        process.env.JWT_SECRET || 'people_x_jwt_secret',
        { expiresIn: '24h' }
      );
      
      await client.query('COMMIT');
      
      res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: userId,
          email: userResult.rows[0].email,
          username: userResult.rows[0].username,
          first_name: userResult.rows[0].first_name,
          last_name: userResult.rows[0].last_name,
          role: userResult.rows[0].role,
          organization_id: userResult.rows[0].organization_id
        },
        token
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * User login
 */
const loginUser = async (req, res) => {
  const { email, username, password } = req.body;
  
  if ((!email && !username) || !password) {
    return res.status(400).json({ error: 'Email/username and password are required' });
  }
  
  try {
    // Find user by email or username
    const userResult = await pgPool.query(
      'SELECT id, email, username, password, first_name, last_name, role, organization_id, status FROM security.users WHERE email = $1 OR username = $2',
      [email ? email.toLowerCase() : '', username ? username.toLowerCase() : '']
    );
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = userResult.rows[0];
    
    // Check if user is active
    if (user.status !== 'active') {
      return res.status(401).json({ error: 'Account is not active' });
    }
    
    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      // Log failed login attempt
      await pgPool.query(
        `INSERT INTO security.login_history 
        (user_id, login_time, ip_address, user_agent, success) 
        VALUES ($1, CURRENT_TIMESTAMP, $2, $3, $4)`,
        [user.id, req.ip, req.headers['user-agent'], false]
      );
      
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role, organization_id: user.organization_id },
      process.env.JWT_SECRET || 'people_x_jwt_secret',
      { expiresIn: '24h' }
    );
    
    // Log successful login
    await pgPool.query(
      `INSERT INTO security.login_history 
      (user_id, login_time, ip_address, user_agent, success) 
      VALUES ($1, CURRENT_TIMESTAMP, $2, $3, $4)`,
      [user.id, req.ip, req.headers['user-agent'], true]
    );
    
    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        organization_id: user.organization_id
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get user profile
 */
const getUserProfile = async (req, res) => {
  try {
    // Get user from database
    const userResult = await pgPool.query(
      'SELECT id, email, username, first_name, last_name, role, organization_id, status, created_at, updated_at FROM security.users WHERE id = $1',
      [req.user.id]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get organization details
    const orgResult = await pgPool.query(
      'SELECT id, name FROM core.organizations WHERE id = $1',
      [userResult.rows[0].organization_id]
    );
    
    // Get employee details if exists
    const employeeResult = await pgPool.query(
      'SELECT id, job_title_id, department_id, location_id FROM hr.employees WHERE user_id = $1',
      [req.user.id]
    );
    
    const user = {
      ...userResult.rows[0],
      organization: orgResult.rows[0] || null,
      employee: employeeResult.rows[0] || null
    };
    
    // If employee exists, get additional details
    if (user.employee) {
      // Get job title
      const jobTitleResult = await pgPool.query(
        'SELECT id, title FROM core.job_titles WHERE id = $1',
        [user.employee.job_title_id]
      );
      
      // Get department
      const departmentResult = await pgPool.query(
        'SELECT id, name FROM core.departments WHERE id = $1',
        [user.employee.department_id]
      );
      
      // Get location
      const locationResult = await pgPool.query(
        'SELECT id, name FROM core.locations WHERE id = $1',
        [user.employee.location_id]
      );
      
      user.employee.job_title = jobTitleResult.rows[0] || null;
      user.employee.department = departmentResult.rows[0] || null;
      user.employee.location = locationResult.rows[0] || null;
    }
    
    res.status(200).json({
      user
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update user profile
 */
const updateUserProfile = async (req, res) => {
  const { first_name, last_name, email, username, current_password, new_password } = req.body;
  
  try {
    // Get current user data
    const userResult = await pgPool.query(
      'SELECT id, email, username, password FROM security.users WHERE id = $1',
      [req.user.id]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
    // If changing email or username, check if already exists
    if ((email && email.toLowerCase() !== user.email) || 
        (username && username.toLowerCase() !== user.username)) {
      const existingUserCheck = await pgPool.query(
        'SELECT id FROM security.users WHERE (email = $1 OR username = $2) AND id != $3',
        [
          email ? email.toLowerCase() : user.email, 
          username ? username.toLowerCase() : user.username, 
          req.user.id
        ]
      );
      
      if (existingUserCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Email or username already exists' });
      }
    }
    
    // Start building update query
    let updateQuery = `
      UPDATE security.users 
      SET updated_at = CURRENT_TIMESTAMP
    `;
    const queryParams = [];
    let paramIndex = 1;
    
    // Add fields to update
    if (first_name) {
      updateQuery += `, first_name = $${paramIndex}`;
      queryParams.push(first_name);
      paramIndex++;
    }
    
    if (last_name) {
      updateQuery += `, last_name = $${paramIndex}`;
      queryParams.push(last_name);
      paramIndex++;
    }
    
    if (email) {
      updateQuery += `, email = $${paramIndex}`;
      queryParams.push(email.toLowerCase());
      paramIndex++;
    }
    
    if (username) {
      updateQuery += `, username = $${paramIndex}`;
      queryParams.push(username.toLowerCase());
      paramIndex++;
    }
    
    // If changing password
    if (current_password && new_password) {
      // Verify current password
      const isMatch = await bcrypt.compare(current_password, user.password);
      
      if (!isMatch) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }
      
      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(new_password, salt);
      
      updateQuery += `, password = $${paramIndex}`;
      queryParams.push(hashedPassword);
      paramIndex++;
    }
    
    // Complete the query
    updateQuery += ` WHERE id = $${paramIndex} RETURNING id, email, username, first_name, last_name, role, organization_id, status, updated_at`;
    queryParams.push(req.user.id);
    
    // Execute update
    const result = await pgPool.query(updateQuery, queryParams);
    
    res.status(200).json({
      message: 'Profile updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Create user invitation
 */
const createInvitation = async (req, res) => {
  const { email, role, expires_in_days } = req.body;
  
  if (!email || !role) {
    return res.status(400).json({ error: 'Email and role are required' });
  }
  
  // Check if user has permission to invite
  if (!['admin', 'hr_manager'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Unauthorized to create invitations' });
  }
  
  try {
    // Check if email already exists
    const existingUserCheck = await pgPool.query(
      'SELECT id FROM security.users WHERE email = $1',
      [email.toLowerCase()]
    );
    
    if (existingUserCheck.rows.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }
    
    // Check if invitation already exists
    const existingInvitationCheck = await pgPool.query(
      'SELECT id FROM security.invitations WHERE email = $1 AND used_at IS NULL AND expires_at > CURRENT_TIMESTAMP',
      [email.toLowerCase()]
    );
    
    if (existingInvitationCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Active invitation for this email already exists' });
    }
    
    // Generate invitation token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Calculate expiration date (default 7 days)
    const expiresInDays = expires_in_days || 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    
    // Create invitation
    const result = await pgPool.query(
      `INSERT INTO security.invitations 
      (email, organization_id, role, token, created_by, expires_at, created_at, updated_at) 
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
      RETURNING id, email, role, token, expires_at`,
      [
        email.toLowerCase(), req.user.organization_id, role, token, req.user.id, expiresAt
      ]
    );
    
    res.status(201).json({
      message: 'Invitation created successfully',
      invitation: result.rows[0]
    });
  } catch (error) {
    console.error('Create invitation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get audit logs
 */
const getAuditLogs = async (req, res) => {
  const { user_id, url_pattern, start_date, end_date, limit, offset } = req.query;
  
  // Check if user has permission to view audit logs
  if (!['admin', 'security_admin', 'data_protection_officer'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Unauthorized to view audit logs' });
  }
  
  try {
    let query = `
      SELECT id, user_id, user_role, method, url, ip_address, 
      request_body, status_code, request_time, response_time, duration_ms
      FROM security.audit_logs
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramIndex = 1;
    
    // Add filters
    if (user_id) {
      query += ` AND user_id = $${paramIndex}`;
      queryParams.push(user_id);
      paramIndex++;
    }
    
    if (url_pattern) {
      query += ` AND url LIKE $${paramIndex}`;
      queryParams.push(`%${url_pattern}%`);
      paramIndex++;
    }
    
    if (start_date) {
      query += ` AND request_time >= $${paramIndex}`;
      queryParams.push(start_date);
      paramIndex++;
    }
    
    if (end_date) {
      query += ` AND request_time <= $${paramIndex}`;
      queryParams.push(end_date);
      paramIndex++;
    }
    
    // Add sorting
    query += ` ORDER BY request_time DESC`;
    
    // Add pagination
    const limitValue = limit ? parseInt(limit) : 100;
    const offsetValue = offset ? parseInt(offset) : 0;
    
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limitValue, offsetValue);
    
    // Get total count
    const countQuery = query.replace(
      'SELECT id, user_id, user_role, method, url, ip_address, request_body, status_code, request_time, response_time, duration_ms',
      'SELECT COUNT(*)'
    );
    const countResult = await pgPool.query(
      countQuery.split('ORDER BY')[0],
      queryParams.slice(0, paramIndex - 1)
    );
    
    // Execute main query
    const result = await pgPool.query(query, queryParams);
    
    res.status(200).json({
      logs: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        limit: limitValue,
        offset: offsetValue
      }
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get login history
 */
const getLoginHistory = async (req, res) => {
  const { user_id, limit } = req.query;
  
  // If requesting another user's history, check permissions
  if (user_id && user_id !== req.user.id && !['admin', 'security_admin', 'data_protection_officer'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Unauthorized to view this login history' });
  }
  
  try {
    const userId = user_id || req.user.id;
    const limitValue = limit ? parseInt(limit) : 50;
    
    const result = await pgPool.query(
      `SELECT id, user_id, login_time, ip_address, user_agent, success
      FROM security.login_history
      WHERE user_id = $1
      ORDER BY login_time DESC
      LIMIT $2`,
      [userId, limitValue]
    );
    
    res.status(200).json({
      login_history: result.rows
    });
  } catch (error) {
    console.error('Get login history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  createInvitation,
  getAuditLogs,
  getLoginHistory
};
