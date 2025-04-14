// Security Middleware for People X
const crypto = require('crypto');
const { pgPool } = require('../config/database');

/**
 * Data encryption middleware
 * Encrypts sensitive data before storing in database
 */
const encryptData = (fields) => {
  return (req, res, next) => {
    try {
      // Get encryption key from environment or config
      const encryptionKey = process.env.ENCRYPTION_KEY || 'people_x_default_encryption_key_32byte';
      
      // Only encrypt specified fields that exist in the request body
      if (req.body) {
        fields.forEach(field => {
          if (req.body[field]) {
            // Create initialization vector
            const iv = crypto.randomBytes(16);
            
            // Create cipher
            const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(encryptionKey), iv);
            
            // Encrypt the data
            let encrypted = cipher.update(req.body[field].toString(), 'utf8', 'hex');
            encrypted += cipher.final('hex');
            
            // Store the encrypted data with IV
            req.body[field] = `${iv.toString('hex')}:${encrypted}`;
          }
        });
      }
      
      next();
    } catch (error) {
      console.error('Encryption error:', error);
      next(error);
    }
  };
};

/**
 * Data decryption middleware
 * Decrypts sensitive data after retrieving from database
 */
const decryptData = (data, fields) => {
  try {
    // Get encryption key from environment or config
    const encryptionKey = process.env.ENCRYPTION_KEY || 'people_x_default_encryption_key_32byte';
    
    // Only decrypt specified fields that exist in the data
    fields.forEach(field => {
      if (data[field] && typeof data[field] === 'string' && data[field].includes(':')) {
        // Split IV and encrypted data
        const [ivHex, encryptedHex] = data[field].split(':');
        
        // Convert hex to buffers
        const iv = Buffer.from(ivHex, 'hex');
        const encrypted = Buffer.from(encryptedHex, 'hex');
        
        // Create decipher
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(encryptionKey), iv);
        
        // Decrypt the data
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        // Replace encrypted data with decrypted data
        data[field] = decrypted;
      }
    });
    
    return data;
  } catch (error) {
    console.error('Decryption error:', error);
    return data;
  }
};

/**
 * Audit logging middleware
 * Logs all API requests and responses
 */
const auditLog = async (req, res, next) => {
  // Capture original end method
  const originalEnd = res.end;
  
  // Get request start time
  const requestTime = new Date();
  
  // Capture request details
  const requestDetails = {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    user_id: req.user ? req.user.id : null,
    user_role: req.user ? req.user.role : null,
    request_body: JSON.stringify(sanitizeRequestBody(req.body)),
    request_time: requestTime
  };
  
  // Override end method
  res.end = function(chunk, encoding) {
    // Call original end method
    originalEnd.call(this, chunk, encoding);
    
    // Get response time
    const responseTime = new Date();
    const duration = responseTime - requestTime;
    
    // Capture response details
    const responseDetails = {
      status_code: res.statusCode,
      response_time: responseTime,
      duration_ms: duration
    };
    
    // Log to database
    logToDatabase({
      ...requestDetails,
      ...responseDetails
    }).catch(err => console.error('Audit log error:', err));
  };
  
  next();
};

/**
 * Sanitize request body to remove sensitive information
 */
const sanitizeRequestBody = (body) => {
  if (!body) return {};
  
  // Create a copy of the body
  const sanitized = { ...body };
  
  // List of sensitive fields to redact
  const sensitiveFields = [
    'password', 'password_confirmation', 'current_password',
    'credit_card', 'card_number', 'cvv', 'ssn', 'social_security_number',
    'tax_id', 'bank_account', 'account_number', 'routing_number',
    'access_token', 'refresh_token', 'api_key', 'secret_key'
  ];
  
  // Redact sensitive fields
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  return sanitized;
};

/**
 * Log to database
 */
const logToDatabase = async (logData) => {
  try {
    await pgPool.query(
      `INSERT INTO security.audit_logs 
      (user_id, user_role, method, url, ip_address, request_body, status_code, request_time, response_time, duration_ms) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        logData.user_id,
        logData.user_role,
        logData.method,
        logData.url,
        logData.ip,
        logData.request_body,
        logData.status_code,
        logData.request_time,
        logData.response_time,
        logData.duration_ms
      ]
    );
  } catch (error) {
    console.error('Error writing to audit log:', error);
  }
};

/**
 * GDPR data access request handler
 */
const handleDataAccessRequest = async (req, res) => {
  const { user_id } = req.params;
  
  if (!user_id) {
    return res.status(400).json({ error: 'User ID is required' });
  }
  
  // Check if requester is authorized to access this data
  if (req.user.id !== user_id && req.user.role !== 'admin' && req.user.role !== 'data_protection_officer') {
    return res.status(403).json({ error: 'Unauthorized to access this data' });
  }
  
  try {
    // Collect all user data
    const userData = await collectUserData(user_id);
    
    // Log the data access request
    await pgPool.query(
      `INSERT INTO security.data_access_requests 
      (user_id, requested_by, request_type, status, created_at) 
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
      [user_id, req.user.id, 'export', 'completed']
    );
    
    res.status(200).json({
      message: 'Data access request completed successfully',
      userData
    });
  } catch (error) {
    console.error('Data access request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GDPR data deletion request handler
 */
const handleDataDeletionRequest = async (req, res) => {
  const { user_id } = req.params;
  const { reason } = req.body;
  
  if (!user_id) {
    return res.status(400).json({ error: 'User ID is required' });
  }
  
  // Check if requester is authorized to delete this data
  if (req.user.id !== user_id && req.user.role !== 'admin' && req.user.role !== 'data_protection_officer') {
    return res.status(403).json({ error: 'Unauthorized to delete this data' });
  }
  
  try {
    // Log the data deletion request
    await pgPool.query(
      `INSERT INTO security.data_deletion_requests 
      (user_id, requested_by, reason, status, created_at) 
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      RETURNING id`,
      [user_id, req.user.id, reason, 'pending']
    );
    
    // In a real implementation, this would initiate a workflow for data deletion
    // For this demo, we'll just return a success message
    
    res.status(200).json({
      message: 'Data deletion request submitted successfully',
      status: 'pending'
    });
  } catch (error) {
    console.error('Data deletion request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Collect all user data for GDPR request
 */
const collectUserData = async (userId) => {
  // Start a transaction to ensure consistent data
  const client = await pgPool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Get user account data
    const userResult = await client.query(
      `SELECT id, email, username, first_name, last_name, role, status, created_at, updated_at
      FROM security.users
      WHERE id = $1`,
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }
    
    const user = userResult.rows[0];
    
    // Get employee data
    const employeeResult = await client.query(
      `SELECT id, user_id, first_name, last_name, email, phone, date_of_birth, gender, 
      address, city, state, postal_code, country, hire_date, employment_status, employment_type
      FROM hr.employees
      WHERE user_id = $1`,
      [userId]
    );
    
    const employee = employeeResult.rows[0] || null;
    
    // If employee exists, get additional data
    let additionalData = {};
    
    if (employee) {
      // Get salary data
      const salaryResult = await client.query(
        `SELECT id, employee_id, salary_amount, currency, salary_type, payment_frequency, 
        effective_date, created_at
        FROM compensation.employee_salaries
        WHERE employee_id = $1
        ORDER BY effective_date DESC`,
        [employee.id]
      );
      
      // Get benefit data
      const benefitResult = await client.query(
        `SELECT eb.id, eb.employee_id, eb.benefit_plan_id, eb.enrollment_date, eb.status,
        bp.name as benefit_name, bp.benefit_type
        FROM compensation.employee_benefits eb
        JOIN compensation.benefit_plans bp ON eb.benefit_plan_id = bp.id
        WHERE eb.employee_id = $1`,
        [employee.id]
      );
      
      // Get leave data
      const leaveResult = await client.query(
        `SELECT id, employee_id, leave_type_id, start_date, end_date, status, reason
        FROM hr.leave_requests
        WHERE employee_id = $1
        ORDER BY start_date DESC`,
        [employee.id]
      );
      
      // Get performance review data
      const reviewResult = await client.query(
        `SELECT id, employee_id, review_period, rating, status, submitted_at
        FROM performance.performance_reviews
        WHERE employee_id = $1
        ORDER BY submitted_at DESC`,
        [employee.id]
      );
      
      // Get learning data
      const learningResult = await client.query(
        `SELECT en.id, en.employee_id, en.course_id, en.enrollment_date, en.status, 
        en.completion_date, c.title as course_title
        FROM learning.enrollments en
        JOIN learning.courses c ON en.course_id = c.id
        WHERE en.employee_id = $1
        ORDER BY en.enrollment_date DESC`,
        [employee.id]
      );
      
      additionalData = {
        salary_history: salaryResult.rows,
        benefits: benefitResult.rows,
        leave_requests: leaveResult.rows,
        performance_reviews: reviewResult.rows,
        learning_enrollments: learningResult.rows
      };
    }
    
    // Get login history
    const loginHistoryResult = await client.query(
      `SELECT id, user_id, login_time, ip_address, user_agent, success
      FROM security.login_history
      WHERE user_id = $1
      ORDER BY login_time DESC
      LIMIT 50`,
      [userId]
    );
    
    await client.query('COMMIT');
    
    return {
      user_account: user,
      employee_data: employee,
      ...additionalData,
      login_history: loginHistoryResult.rows
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Rate limiting middleware
 */
const rateLimit = (maxRequests, timeWindow) => {
  // Store request counts in memory
  // In production, this would use Redis or another distributed cache
  const requestCounts = new Map();
  
  return (req, res, next) => {
    const ip = req.ip;
    const now = Date.now();
    
    // Initialize or clean up old requests
    if (!requestCounts.has(ip)) {
      requestCounts.set(ip, []);
    }
    
    const requests = requestCounts.get(ip);
    
    // Remove requests outside the time window
    const validRequests = requests.filter(timestamp => now - timestamp < timeWindow);
    requestCounts.set(ip, validRequests);
    
    // Check if rate limit is exceeded
    if (validRequests.length >= maxRequests) {
      return res.status(429).json({
        error: 'Too many requests, please try again later',
        retryAfter: Math.ceil((validRequests[0] + timeWindow - now) / 1000)
      });
    }
    
    // Add current request timestamp
    validRequests.push(now);
    requestCounts.set(ip, validRequests);
    
    next();
  };
};

/**
 * Content Security Policy middleware
 */
const setSecurityHeaders = (req, res, next) => {
  // Set Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'"
  );
  
  // Set X-Content-Type-Options
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Set X-Frame-Options
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  
  // Set X-XSS-Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Set Referrer-Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Set Permissions-Policy
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );
  
  next();
};

module.exports = {
  encryptData,
  decryptData,
  auditLog,
  handleDataAccessRequest,
  handleDataDeletionRequest,
  rateLimit,
  setSecurityHeaders
};
