// Authorization middleware for People X
/**
 * Middleware to check specific roles for authorization
 * @param {Array} allowedRoles - Array of roles allowed to access the resource
 */
const authorize = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // For backwards compatibility if role is stored directly on user object
    const userRoles = req.user.roles || [req.user.role];
    
    // Check if user has one of the allowed roles
    const hasAccess = allowedRoles.some(role => userRoles.includes(role));
    
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied. Insufficient permissions' });
    }
    
    next();
  };
};

module.exports = {
  authorize
}; 