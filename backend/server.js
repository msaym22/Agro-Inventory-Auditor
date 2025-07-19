require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');

const app = express();

// =====================
// Middleware Setup
// =====================
// CORS Configuration
const corsOptions = {
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  preflightContinue: false,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Cookie Parser
app.use(cookieParser());

// File Uploads - Serve static files from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// =====================
// Database Setup
// =====================
const { sequelize } = require('./models');

// Test database connection
sequelize.authenticate()
  .then(() => {
    console.log('Database connected successfully');
    // WARNING: { force: true } will drop all existing tables and recreate them.
    // Use this only in development or if data loss is acceptable.
    // For permanent data storage and schema evolution without data loss, use migrations.
    return sequelize.sync({ force: true }); // Modified to force sync for development
  })
  .then(() => {
    console.log('Database models synchronized');
  })
  .catch(err => {
    console.error('Database connection error:', err);
  });

// =====================
// Route Setup
// =====================
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const customerRoutes = require('./routes/customerRoutes');
const saleRoutes = require('./routes/saleRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const backupRoutes = require('./routes/backupRoutes');
const authMiddleware = require('./middleware/auth'); // Assuming this is general auth middleware

// IMPORTANT: Place routes that use Multer (for file uploads) BEFORE express.json() and express.urlencoded()
// Multer handles 'multipart/form-data' parsing, and if express.json/urlencoded run first, they can consume the body.

// Protected routes that use Multer (e.g., product image upload, sale receipt upload)
app.use('/api/products', authMiddleware, productRoutes);
app.use('/api/sales', authMiddleware, saleRoutes);
app.use('/api/backup', authMiddleware, backupRoutes);

// Apply generic body parsers AFTER Multer-dependent routes
// These parsers are for 'application/json' and 'application/x-www-form-urlencoded'
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Other protected routes that primarily expect JSON or URL-encoded bodies
app.use('/api/customers', authMiddleware, customerRoutes);
app.use('/api/analytics', authMiddleware, analyticsRoutes);

// Auth routes (typically send JSON body, so fine after global parsers)
app.use('/api/auth', authRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// =====================
// Error Handling
// =====================
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// =====================
// Backup Scheduling
// =====================
try {
  const { scheduleBackups } = require('./utils/backup');
  scheduleBackups();
} catch (error) {
  console.log('Backup scheduling not available:', error.message);
}

// =====================
// Server Startup
// =====================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`CORS configured for: http://localhost:3000`);
  console.log(`Health check available at: http://localhost:${PORT}/api/health`);
});

// Export for testing
module.exports = app;