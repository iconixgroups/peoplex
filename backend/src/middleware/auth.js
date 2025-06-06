// Authentication middleware for People X
const jwt = require('jsonwebtoken');
const config = require('../config/config');

/**
 * Middleware to authenticate JWT tokens
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }
  
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token.' });
  }
};

// Alias for backward compatibility
const authenticate = authenticateToken;

// Alias for recruitment module
const authenticateUser = authenticateToken;

/**
 * Middleware to check role-based permissions
 * @param {Array} requiredRoles - Array of roles allowed to access the route
 */
const checkRole = (requiredRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated.' });
    }
    
    const hasRole = requiredRoles.some(role => req.user.roles.includes(role));
    
    if (!hasRole) {
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }
    
    next();
  };
};

/**
 * Middleware to check specific permissions
 * @param {Array} requiredPermissions - Array of permissions required to access the route
 */
const checkPermission = (requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated.' });
    }
    
    const hasPermission = requiredPermissions.some(permission => 
      req.user.permissions.includes(permission)
    );
    
    if (!hasPermission) {
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }
    
    next();
  };
};

/**
 * Middleware to authorize HR roles
 * Checks if user has HR-related roles or permissions
 */
const authorizeHR = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated.' });
  }
  
  // Get user roles as array, handling potential format differences
  const userRoles = Array.isArray(req.user.roles) ? req.user.roles : [req.user.role];
  
  // Check if user has HR-related roles
  const hrRoles = ['admin', 'hr_manager', 'hr_admin', 'recruiter'];
  const hasHRRole = hrRoles.some(role => userRoles.includes(role));
  
  if (!hasHRRole) {
    return res.status(403).json({ error: 'Access denied. HR role required.' });
  }
  
  next();
};

module.exports = {
  authenticateToken,
  authenticate, // Export the alias
  authenticateUser, // Export alias for recruitment module
  authorizeHR, // Export HR authorization middleware
  checkRole,
  checkPermission
};
