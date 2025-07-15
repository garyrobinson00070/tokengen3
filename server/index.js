const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const cron = require('node-cron');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const deployRoutes = require('./api/deploy');
const authRoutes = require('./api/auth');
const contractRoutes = require('./api/contracts');
const tokenMetadataRoutes = require('./api/token-metadata');
const badgeRoutes = require('./api/badges');
const governanceRoutes = require('./api/governance');
const emergencyDeployRoutes = require('./api/emergency-deploy');
const connectDB = require('./db');
const applySecurityMiddleware = require('./middleware/security');

const app = express();
const PORT = process.env.PORT || 3001;

// Apply security middleware
applySecurityMiddleware(app);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/deploy', deployRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/token-metadata', tokenMetadataRoutes);
app.use('/api/badges', badgeRoutes);
app.use('/api/governance', governanceRoutes);
app.use('/api/emergency-deploy', emergencyDeployRoutes);

// Set up cron job to update governance proposal statuses
cron.schedule('*/10 * * * *', async () => { // Run every 10 minutes
  try {
    console.log('Running cron job to update governance proposal statuses');
    
    // Call the API endpoint to update proposal statuses
    const response = await fetch(`http://localhost:${PORT}/api/governance/update-statuses`, {
      method: 'PUT'
    });
    
    if (!response.ok) {
      console.error('Failed to update governance proposal statuses:', response.status, response.statusText);
    } else {
      console.log('Successfully updated governance proposal statuses');
    }
  } catch (error) {
    console.error('Error running governance status update cron job:', error);
  }
});

// Serve deployment files
app.use('/deployments', express.static(path.join(__dirname, '..', 'deployments')));

// Connect to database
connectDB().then(() => {
  console.log('Database connected successfully');
}).catch(err => {
  console.error('Database connection error:', err);
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  
  // Log detailed error information in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      path: req.path,
      method: req.method,
      body: req.body,
      params: req.params,
      query: req.query,
      headers: req.headers
    });
  }
  
  // In production, log to a proper logging service
  if (process.env.NODE_ENV === 'production') {
    // This would be replaced with actual error logging service
    // Example: logger.error('Server error', { error, request: { path: req.path, method: req.method } });
  }
  
  // Send appropriate error response
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
    errorId: Date.now().toString(36) // For tracking in logs
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`TokenForge API server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  
  // Log important configuration
  if (process.env.NODE_ENV === 'development') {
    console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
    console.log('Available API endpoints:');
    console.log('- /api/auth - Authentication endpoints');
    console.log('- /api/deploy - Deployment endpoints');
    console.log('- /api/contracts - Contract management endpoints');
  }
});