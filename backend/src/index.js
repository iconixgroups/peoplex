// Entry point for People X backend

// Import the main application
const app = require('./app');
const config = require('./config/config');

// Start the server
const PORT = process.env.PORT || config.server?.port || 4000;
app.listen(PORT, () => {
  console.log(`People X server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`Server time: ${new Date().toISOString()}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  // Gracefully shutdown
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  // Gracefully shutdown
  process.exit(1);
}); 