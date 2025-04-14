// Main application file for People X
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { pgPool, connectMongo, connectRedis } = require('./config/database');
const config = require('./config/config');

// Import routes
const authRoutes = require('./api/auth/authRoutes');
const organizationRoutes = require('./api/core/organizationRoutes');
const departmentRoutes = require('./api/core/departmentRoutes');
const locationRoutes = require('./api/core/locationRoutes');
const jobTitleRoutes = require('./api/core/jobTitleRoutes');
const employeeRoutes = require('./api/hr/employeeRoutes');
const attendanceRoutes = require('./api/hr/attendanceRoutes');
const leaveRoutes = require('./api/hr/leaveRoutes');

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

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/job-titles', jobTitleRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leave', leaveRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', version: '1.0.0' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.url} not found`
  });
});

// Start the server
const PORT = config.server.port;
app.listen(PORT, () => {
  console.log(`People X server running on port ${PORT} in ${config.server.env} mode`);
});

module.exports = app;
