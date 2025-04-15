// Main application file for People X
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { pgPool, connectMongo, connectRedis } = require('./config/database');
const config = require('./config/config');

// Import routes
const authRoutes = require('./api/auth/authRoutes');
const securityRoutes = require('./api/security/securityRoutes');
const organizationRoutes = require('./api/core/organizationRoutes');
const departmentRoutes = require('./api/core/departmentRoutes');
const locationRoutes = require('./api/core/locationRoutes');
const jobTitleRoutes = require('./api/core/jobTitleRoutes');
const employeeRoutes = require('./api/hr/employeeRoutes');
const attendanceRoutes = require('./api/hr/attendanceRoutes');
const leaveRoutes = require('./api/hr/leaveRoutes');
const performanceRoutes = require('./api/hr/performance/performanceRoutes');
const learningRoutes = require('./api/hr/learning/learningRoutes');
const payrollRoutes = require('./api/hr/payroll/payrollRoutes');
const recruitmentRoutes = require('./api/hr/recruitment/recruitmentRoutes');
const workflowRoutes = require('./api/workflow/workflowRoutes');
const formRoutes = require('./api/forms/formRoutes');
const dashboardRoutes = require('./api/dashboard/dashboardRoutes');
const webhookRoutes = require('./api/webhooks/webhookRoutes');

// Initialize Express app
const app = express();

// Connect to databases
connectMongo().catch(console.error);
connectRedis().catch(console.error);

// Test PostgreSQL connection
pgPool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error connecting to PostgreSQL:', err);
  } else {
    console.log('PostgreSQL connected:', res.rows[0].now);
  }
});

// Middleware
app.use(helmet()); // Security headers
app.use(cors(config.cors)); // CORS
app.use(morgan('dev')); // Logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// API Routes (v1)
const apiV1Router = express.Router();

apiV1Router.use('/auth', authRoutes);
apiV1Router.use('/security', securityRoutes);
apiV1Router.use('/organizations', organizationRoutes);
apiV1Router.use('/departments', departmentRoutes);
apiV1Router.use('/locations', locationRoutes);
apiV1Router.use('/job-titles', jobTitleRoutes);
apiV1Router.use('/employees', employeeRoutes);
apiV1Router.use('/attendance', attendanceRoutes);
apiV1Router.use('/leave', leaveRoutes);
apiV1Router.use('/performance', performanceRoutes);
apiV1Router.use('/learning', learningRoutes);
apiV1Router.use('/payroll', payrollRoutes);
apiV1Router.use('/recruitment', recruitmentRoutes);
apiV1Router.use('/workflows', workflowRoutes);
apiV1Router.use('/forms', formRoutes);
apiV1Router.use('/dashboards', dashboardRoutes);
apiV1Router.use('/webhooks', webhookRoutes);

// Mount v1 API routes
app.use('/api/v1', apiV1Router);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', version: '1.0.0' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // Format error response according to documentation
  res.status(err.status || 500).json({
    status: 'error',
    error: {
      code: err.code || 'internal_error',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
      details: err.details || []
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    error: {
      code: 'resource_not_found',
      message: `Route ${req.method} ${req.url} not found`
    }
  });
});

// Export the app
module.exports = app;
